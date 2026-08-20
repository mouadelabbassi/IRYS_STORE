package com.dashboard.service;

import com.dashboard.entity.Category;
import com.dashboard.entity.Product;
import com.dashboard.repository.CategoryRepository;
import com.dashboard.repository.ProductRepository;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogDataInitializer implements ApplicationRunner {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ResourceLoader resourceLoader;

    @Value("${csv.import.file-path:classpath:amazon_dataset_ready.csv}")
    private String csvFilePath;

    @Value("${csv.import.batch-size:100}")
    private int batchSize;

    @Value("${csv.import.auto-import-on-startup:false}")
    private boolean autoImportOnStartup;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(ApplicationArguments args) throws Exception {
        if (!autoImportOnStartup) {
            log.info("Catalog bootstrap is disabled (csv.import.auto-import-on-startup=false)");
            return;
        }

        long existingProducts = productRepository.count();
        if (existingProducts > 0) {
            log.info("Catalog bootstrap skipped: products table already contains {} rows", existingProducts);
            return;
        }

        long existingCategories = categoryRepository.count();
        if (existingCategories > 0) {
            log.warn("Catalog bootstrap skipped: products table is empty but categories table contains {} rows; " +
                    "refusing to mix seed data with an existing catalog", existingCategories);
            return;
        }

        if (batchSize <= 0) {
            throw new IllegalStateException("csv.import.batch-size must be greater than zero");
        }

        long startedAt = System.currentTimeMillis();
        List<CatalogRow> rows = readCatalogRows();
        Map<String, Category> categories = createCategories(rows);
        int importedProducts = saveProducts(rows, categories);
        long durationMs = System.currentTimeMillis() - startedAt;

        log.info("Catalog bootstrap complete: {} products and {} categories imported in {} ms using batches of {}",
                importedProducts, categories.size(), durationMs, batchSize);
    }

    private List<CatalogRow> readCatalogRows() throws Exception {
        Resource resource = resourceLoader.getResource(csvFilePath);
        if (!resource.exists()) {
            throw new IllegalStateException("Catalog CSV does not exist: " + csvFilePath);
        }

        try (CSVReader reader = new CSVReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            List<String[]> records = reader.readAll();
            if (records.size() <= 1) {
                throw new IllegalStateException("Catalog CSV contains no product rows: " + csvFilePath);
            }

            List<CatalogRow> rows = new ArrayList<>(records.size() - 1);
            Set<String> seenAsins = new LinkedHashSet<>();

            for (int index = 1; index < records.size(); index++) {
                int csvLine = index + 1;
                String[] record = records.get(index);
                if (record.length < 11) {
                    throw new IllegalStateException("Invalid catalog CSV row at line " + csvLine +
                            ": expected 11 columns but found " + record.length);
                }

                String asin = requiredText(record[0], "ASIN", csvLine);
                if (!seenAsins.add(asin)) {
                    throw new IllegalStateException("Duplicate ASIN " + asin + " at CSV line " + csvLine);
                }

                rows.add(new CatalogRow(
                        asin,
                        requiredText(record[1], "Category", csvLine),
                        cleanText(record[2]),
                        parseInteger(record[3], "No of Sellers", csvLine),
                        parseInteger(record[4], "Rank", csvLine),
                        parseDecimal(record[5], "Rating", csvLine),
                        parseInteger(record[6], "Reviews Count", csvLine),
                        parseDecimal(record[7], "Price", csvLine),
                        requiredText(record[8], "Product Name", csvLine),
                        cleanText(record[9]),
                        cleanText(record[10])
                ));
            }

            return rows;
        }
    }

    private Map<String, Category> createCategories(List<CatalogRow> rows) {
        Map<String, Integer> productCounts = new LinkedHashMap<>();
        for (CatalogRow row : rows) {
            productCounts.merge(row.categoryName(), 1, Integer::sum);
        }

        List<Category> categoriesToSave = productCounts.entrySet().stream()
                .map(entry -> Category.builder()
                        .name(entry.getKey())
                        .description("Imported from the bundled Amazon catalog")
                        .productCount(entry.getValue())
                        .build())
                .toList();

        Map<String, Category> savedByName = new LinkedHashMap<>();
        categoryRepository.saveAll(categoriesToSave)
                .forEach(category -> savedByName.put(category.getName(), category));
        categoryRepository.flush();
        return savedByName;
    }

    private int saveProducts(List<CatalogRow> rows, Map<String, Category> categories) {
        int imported = 0;
        for (int offset = 0; offset < rows.size(); offset += batchSize) {
            int end = Math.min(offset + batchSize, rows.size());
            List<Product> products = rows.subList(offset, end).stream()
                    .map(row -> toProduct(row, categories.get(row.categoryName())))
                    .toList();

            productRepository.saveAll(products);
            productRepository.flush();
            imported += products.size();
        }
        return imported;
    }

    private Product toProduct(CatalogRow row, Category category) {
        return Product.builder()
                .asin(row.asin())
                .category(category)
                .productLink(row.productLink())
                .noOfSellers(row.noOfSellers())
                .ranking(row.ranking())
                .rating(row.rating())
                .reviewsCount(row.reviewsCount())
                .price(row.price())
                .productName(row.productName())
                .description(row.description())
                .imageUrl(row.imageUrl())
                .isBestseller(row.ranking() != null && row.ranking() <= 10)
                .build();
    }

    private static String requiredText(String value, String column, int csvLine) {
        String cleaned = cleanText(value);
        if (cleaned == null) {
            throw new IllegalStateException(column + " is required at CSV line " + csvLine);
        }
        return cleaned;
    }

    private static String cleanText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static Integer parseInteger(String value, String column, int csvLine) {
        String cleaned = cleanText(value);
        if (cleaned == null) {
            return null;
        }
        try {
            return Integer.valueOf(cleaned);
        } catch (NumberFormatException exception) {
            throw new IllegalStateException(column + " must be an integer at CSV line " + csvLine, exception);
        }
    }

    private static BigDecimal parseDecimal(String value, String column, int csvLine) {
        String cleaned = cleanText(value);
        if (cleaned == null) {
            return null;
        }
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException exception) {
            throw new IllegalStateException(column + " must be a decimal at CSV line " + csvLine, exception);
        }
    }

    private record CatalogRow(
            String asin,
            String categoryName,
            String productLink,
            Integer noOfSellers,
            Integer ranking,
            BigDecimal rating,
            Integer reviewsCount,
            BigDecimal price,
            String productName,
            String description,
            String imageUrl
    ) {
    }
}
