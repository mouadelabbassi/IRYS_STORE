package com.dashboard. service;

import com.dashboard.dto.request.OrderRequest;
import com.dashboard. dto.response.OrderResponse;
import com.dashboard.entity.*;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard. repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain. Pageable;
import org.springframework.stereotype.Service;
import org.springframework. transaction.annotation. Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final PlatformRevenueRepository platformRevenueRepository;
    private final NotificationService notificationService;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        log.info("Creating guest order for {} {}", request.getFirstName(), request.getLastName());

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        Map<String, Integer> requestedQuantities = new TreeMap<>();
        for (OrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            int quantity = itemRequest. getQuantity() != null ? itemRequest. getQuantity() : 1;
            String asin = itemRequest.getProductAsin().trim();
            int combinedQuantity;
            try {
                combinedQuantity = Math.addExact(requestedQuantities.getOrDefault(asin, 0), quantity);
            } catch (ArithmeticException exception) {
                throw new BadRequestException("Invalid quantity for product: " + asin);
            }
            if (combinedQuantity > 100) {
                throw new BadRequestException("Quantity must not exceed 100 for product: " + asin);
            }
            requestedQuantities.put(asin, combinedQuantity);
        }

        List<Product> lockedProducts = productRepository.findAllApprovedByAsinForUpdate(
                requestedQuantities.keySet().stream().toList(),
                Product.ApprovalStatus.APPROVED
        );
        Map<String, Product> productsByAsin = lockedProducts.stream()
                .collect(Collectors.toMap(Product::getAsin, Function.identity()));

        for (Map.Entry<String, Integer> requestedItem : requestedQuantities.entrySet()) {
            Product product = productsByAsin.get(requestedItem.getKey());
            if (product == null) {
                throw new ResourceNotFoundException("Product is not available: " + requestedItem.getKey());
            }
            if (product.getPrice() == null) {
                throw new BadRequestException("Product price not available: " + product.getProductName());
            }
            if (!product.isInStock()) {
                throw new BadRequestException(product.getProductName() + " is currently out of stock");
            }
            if (!product.hasEnoughStock(requestedItem.getValue())) {
                throw new BadRequestException(product.getProductName() +
                        " only has " + product.getStockQuantity() + " units in stock");
            }
        }

        Order order = Order.builder()
                .customerFirstName(request.getFirstName().trim())
                .customerLastName(request.getLastName().trim())
                .customerPhone(request.getPhone().trim())
                .shippingAddress(request.getAddress().trim())
                .shippingCity(request.getCity().trim())
                .status(Order.OrderStatus.PENDING)
                .notes(request.getNotes())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalItems = 0;

        for (Map.Entry<String, Integer> requestedItem : requestedQuantities.entrySet()) {
            Product product = productsByAsin.get(requestedItem.getKey());
            int quantity = requestedItem.getValue();

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(product.getPrice())
                    .subtotal(product.getPrice(). multiply(BigDecimal.valueOf(quantity)))
                    .productName(product.getProductName())
                    .productImage(product.getImageUrl())
                    .seller(product.getSeller())
                    .sellerRevenueCalculated(false)
                    .build();

            order.addItem(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());
            totalItems += quantity;

            product.reduceStock(quantity);
            productRepository.save(product);
            log.info("STOCK REDUCED for product {} by {} units.  New stock: {}.  Sales count: {}",
                    product.getAsin(), quantity, product.getStockQuantity(), product. getSalesCount());
        }

        order.setTotalAmount(totalAmount);
        order.setTotalItems(totalItems);

        order = orderRepository.save(order);
        log.info("Order created: {} with {} items, total: {}",
                order. getOrderNumber(), totalItems, totalAmount);

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    public OrderResponse confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new BadRequestException("Only pending orders can be confirmed");
        }
        order.confirm();
        order = orderRepository.save(order);
        log.info("Order confirmed: {}", order.getOrderNumber());

        try {
            updateProductSalesCount(order);
        } catch (Exception e) {
            log. error("Failed to update sales count: {}", e.getMessage());
        }

        processPlatformRevenue(order);

        try {
            sendPurchaseNotificationsToAdmin(order);
        } catch (Exception e) {
            log.error("Failed to send admin notifications: {}", e.getMessage(), e);
        }

        return OrderResponse.fromEntity(order);
    }

    private void processPlatformRevenue(Order order) {
        for (OrderItem item : order.getItems()) {
            if (Boolean.TRUE.equals(item.getSellerRevenueCalculated())) {
                continue;
            }

            PlatformRevenue revenue = PlatformRevenue.builder()
                    .order(order)
                    .orderItem(item)
                    .product(item.getProduct())
                    .revenueDate(LocalDate.now())
                    .quantitySold(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .grossAmount(item.getSubtotal())
                    .revenueType(PlatformRevenue.RevenueType.DIRECT_SALE)
                    .description("Direct Irys Store sale")
                    .build();
            platformRevenueRepository.save(revenue);

            item.setSellerRevenueCalculated(true);
            orderItemRepository.save(item);
        }
    }

    private void sendPurchaseNotificationsToAdmin(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();

            notificationService.notifyAdminProductPurchased(
                    product,
                    order,
                    item. getQuantity(),
                    item.getSubtotal(). doubleValue(),
                    order.getCustomerFullName()
            );
        }
    }

    @Transactional
    protected void updateProductSalesCount(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product. incrementSalesCount(item.getQuantity());
            productRepository.save(product);
            log.info("Updated sales count for product {}: new count = {}",
                    product.getAsin(), product.getSalesCount());
        }
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository. findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new BadRequestException("Only pending orders can be cancelled");
        }

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository. save(product);
            log.info("Restored stock for product {}", product.getAsin());
        }

        order.cancel();
        order = orderRepository.save(order);
        log.info("Order cancelled: {}", order.getOrderNumber());

        return OrderResponse.fromEntity(order);
    }

    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        return OrderResponse.fromEntity(order);
    }

    public OrderResponse getOrderByNumber(String orderNumber) {
        Order order = orderRepository. findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
        return OrderResponse. fromEntity(order);
    }

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable)
                .map(OrderResponse::fromEntity);
    }

    public List<OrderResponse> getRecentOrders(int limit) {
        return orderRepository.findRecentOrders(Pageable.ofSize(limit))
                .stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    public Long countTodayOrders() {
        return orderRepository. countTodayOrders();
    }

    public BigDecimal getTodayRevenue() {
        BigDecimal revenue = orderRepository.calculateTodayRevenue();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

}
