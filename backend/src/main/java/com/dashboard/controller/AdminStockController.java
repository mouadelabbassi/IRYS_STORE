package com.dashboard.controller;

import com.dashboard.dto.response.ApiResponse;
import com.dashboard.entity.Product;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/stock")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Stock Management", description = "Admin endpoints for managing product stock")
public class AdminStockController {

    private final ProductRepository productRepository;

    @GetMapping("/dashboard")
    @Operation(summary = "Get stock dashboard", description = "Returns stock overview statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStockDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        long totalProducts = productRepository.count();
        dashboard.put("totalProducts", totalProducts);

        List<Product> lowStockProducts = productRepository.findByStockQuantityLessThanOrderByStockQuantityAsc(10);
        List<Product> outOfStockProducts = productRepository.findOutOfStockProducts();
        long lowStockCount = lowStockProducts.stream()
                .filter(product -> product.getStockQuantity() != null && product.getStockQuantity() > 0)
                .count();
        dashboard.put("lowStockCount", lowStockCount);
        dashboard.put("outOfStockCount", outOfStockProducts.size());

        long healthyStockCount = totalProducts - lowStockCount - outOfStockProducts.size();
        dashboard.put("healthyStockCount", healthyStockCount);

        Long totalUnits = productRepository.sumAllStockQuantity();
        dashboard.put("totalUnitsInStock", totalUnits != null ? totalUnits : 0);

        return ResponseEntity.ok(ApiResponse.success("Stock dashboard retrieved", dashboard));
    }

    @GetMapping("/products")
    @Operation(summary = "Get all products with stock info", description = "Returns paginated products for stock management")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getAllProductsStock(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "asin") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String filter) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> products = getFilteredProducts(filter, pageable);

        Page<Map<String, Object>> result = products.map(this::mapProductToStockInfo);

        return ResponseEntity.ok(ApiResponse.success("Products retrieved", result));
    }

    private Page<Product> getFilteredProducts(String filter, Pageable pageable) {
        if ("low".equalsIgnoreCase(filter)) {
            return productRepository.findByStockQuantityGreaterThanAndStockQuantityLessThan(0, 10, pageable);
        } else if ("out".equalsIgnoreCase(filter)) {
            return productRepository.findOutOfStockProducts(pageable);
        } else if ("healthy".equalsIgnoreCase(filter)) {
            return productRepository.findByStockQuantityGreaterThanEqual(10, pageable);
        } else {
            return productRepository.findAll(pageable);
        }
    }

    @PutMapping("/products/{asin}")
    @Transactional
    @Operation(summary = "Update product stock", description = "Sets the stock quantity for an admin-managed product")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProductStock(
            @PathVariable String asin,
            @Valid @RequestBody StockUpdateAdminRequest request) {

        Product product = productRepository.findByAsinForUpdate(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        int oldQuantity = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        product.setStockQuantity(request.getQuantity());
        product = productRepository.save(product);

        log.info("Admin updated product stock {}: {} -> {}", asin, oldQuantity, request.getQuantity());

        Map<String, Object> result = mapProductToStockInfo(product);
        result.put("previousQuantity", oldQuantity);
        result.put("quantityChange", request.getQuantity() - oldQuantity);

        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", result));
    }

    @PutMapping("/products/{asin}/add")
    @Transactional
    @Operation(summary = "Add product stock", description = "Adds units to an admin-managed product")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addProductStock(
            @PathVariable String asin,
            @RequestParam int quantity) {

        if (quantity <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Quantity must be positive"));
        }

        Product product = productRepository.findByAsinForUpdate(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        int oldQuantity = product.getStockQuantity() != null ?  product.getStockQuantity() : 0;
        int newQuantity;
        try {
            newQuantity = Math.addExact(oldQuantity, quantity);
        } catch (ArithmeticException exception) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Resulting stock quantity is too large"));
        }
        product.setStockQuantity(newQuantity);
        product = productRepository.save(product);

        log.info("Admin added {} units to product {}: {} -> {}", quantity, asin, oldQuantity, newQuantity);

        Map<String, Object> result = mapProductToStockInfo(product);
        result.put("previousQuantity", oldQuantity);
        result.put("addedQuantity", quantity);

        return ResponseEntity.ok(ApiResponse.success("Stock added successfully", result));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products for stock management", description = "Search products by name or ASIN")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchProducts(
            @RequestParam String query) {

        List<Product> products = productRepository.searchByNameOrAsin(query);
        List<Map<String, Object>> result = products.stream()
                .map(this::mapProductToStockInfo)
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Search results", result));
    }

    private Map<String, Object> mapProductToStockInfo(Product product) {
        Map<String, Object> map = new HashMap<>();
        map.put("asin", product.getAsin());
        map.put("productName", product.getProductName());
        map.put("imageUrl", product.getImageUrl());
        map.put("price", product.getPrice());
        map.put("stockQuantity", product.getStockQuantity() != null ? product.getStockQuantity() : 0);
        map.put("categoryName", product.getCategory() != null ? product.getCategory().getName() : null);
        map.put("salesCount", product.getSalesCount());

        int qty = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        String stockStatus;
        if (qty == 0) {
            stockStatus = "OUT_OF_STOCK";
        } else if (qty < 10) {
            stockStatus = "LOW_STOCK";
        } else {
            stockStatus = "IN_STOCK";
        }
        map.put("stockStatus", stockStatus);

        return map;
    }

    public static class StockUpdateAdminRequest {
        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        private Integer quantity;

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
