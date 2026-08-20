package com.dashboard.controller;

import com.dashboard.dto.response.ApiResponse;
import com.dashboard.entity.Order;
import com.dashboard.entity.Product;
import com.dashboard.repository.OrderRepository;
import com.dashboard.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        Long totalProducts = productRepository.countAllExcludingRejected();
        long totalOrders = orderRepository.count();
        long pendingApprovals = productRepository.countByApprovalStatus(Product.ApprovalStatus.PENDING);

        double totalRevenue = 0;
        try {
            List<Order> deliveredOrders = orderRepository.findByStatus(Order.OrderStatus.DELIVERED);
            totalRevenue = deliveredOrders.stream()
                    .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0)
                    .sum();
        } catch (Exception e) {
            totalRevenue = 0;
        }

        double avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        Map<String, Long> ordersByStatus = new HashMap<>();
        try {
            for (Order.OrderStatus status : Order.OrderStatus.values()) {
                long count = orderRepository.countByStatus(status);
                ordersByStatus.put(status.name(), count);
            }
        } catch (Exception e) {
            ordersByStatus.put("PENDING", 0L);
            ordersByStatus.put("DELIVERED", 0L);
        }

        dashboard.put("totalProducts", totalProducts);
        dashboard.put("totalOrders", totalOrders);
        dashboard.put("totalRevenue", totalRevenue);
        dashboard.put("pendingApprovals", pendingApprovals);
        dashboard.put("avgOrderValue", avgOrderValue);
        dashboard.put("ordersByStatus", ordersByStatus);
        dashboard.put("conversionRate", 0.0);

        return ResponseEntity.ok(ApiResponse.success("Dashboard data", dashboard));
    }

    @GetMapping("/revenue-by-month")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByMonth() {
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 11; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusNanos(1);

            double revenue = 0;
            int orderCount = 0;

            try {
                List<Order> orders = orderRepository.findByCreatedAtBetween(monthStart, monthEnd);
                orderCount = orders.size();
                revenue = orders.stream()
                        .filter(o -> o.getStatus() != Order.OrderStatus.CANCELLED)
                        .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0)
                        .sum();
            } catch (Exception e) {
                // Use defaults
            }

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", monthStart.getMonth().toString().substring(0, 3) + " " + monthStart.getYear());
            monthData.put("revenue", revenue);
            monthData.put("orders", orderCount);

            result.add(monthData);
        }

        return ResponseEntity.ok(ApiResponse.success("Revenue by month", result));
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {

        List<Map<String, Object>> result = new ArrayList<>();

        try {
            List<Product> products = productRepository.findByApprovalStatusOrderBySalesCountDesc(
                    Product.ApprovalStatus.APPROVED,
                    PageRequest.of(0, limit)
            );

            result = products.stream().map(p -> {
                Map<String, Object> map = new HashMap<>();
                map.put("asin", p.getAsin());
                map.put("productName", p.getProductName());
                map.put("price", p.getPrice() != null ? p.getPrice().doubleValue() : 0);
                map.put("salesCount", p.getSalesCount() != null ? p.getSalesCount() : 0);
                map.put("revenue", p.getPrice() != null && p.getSalesCount() != null
                        ? p.getPrice().multiply(BigDecimal.valueOf(p.getSalesCount())).doubleValue()
                        : 0);
                map.put("rating", p.getRating() != null ? p.getRating() : 0);
                map.put("category", p.getCategory() != null ? p.getCategory().getName() : "Uncategorized");
                return map;
            }).collect(Collectors.toList());
        } catch (Exception e) {
        }

        return ResponseEntity.ok(ApiResponse.success("Top products", result));
    }

}
