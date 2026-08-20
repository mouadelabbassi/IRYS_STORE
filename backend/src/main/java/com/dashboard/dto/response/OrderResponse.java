package com.dashboard.dto.response;

import com.dashboard.entity. Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util. List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String userName;
    private String userEmail;
    private String customerFirstName;
    private String customerLastName;
    private String customerPhone;
    private String shippingAddress;
    private String shippingCity;
    private String status;
    private String statusDescription;
    private BigDecimal totalAmount;
    private Integer totalItems;
    private LocalDateTime orderDate;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
    private String notes;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private String productAsin;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }

    public static OrderResponse fromEntity(Order order) {
        String customerName = order.getCustomerFullName();
        if (customerName.isBlank() && order.getUser() != null) {
            customerName = order.getUser().getFullName();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .userName(customerName)
                .userEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .customerFirstName(order.getCustomerFirstName())
                .customerLastName(order.getCustomerLastName())
                .customerPhone(order.getCustomerPhone())
                .shippingAddress(order.getShippingAddress())
                .shippingCity(order.getShippingCity())
                .status(order.getStatus().name())
                .statusDescription(order.getStatus().getDescription())
                .totalAmount(order.getTotalAmount())
                .totalItems(order.getTotalItems())
                .orderDate(order.getOrderDate())
                .confirmedAt(order.getConfirmedAt())
                .cancelledAt(order.getCancelledAt())
                .notes(order.getNotes())
                .items(order.getItems().stream()
                        . map(item -> OrderItemResponse. builder()
                                . id(item.getId())
                                . productAsin(item.getProduct().getAsin())
                                .productName(item.getProductName())
                                .productImage(item.getProductImage())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                . subtotal(item. getSubtotal())
                                .build())
                        .toList())
                . createdAt(order.getCreatedAt())
                .build();
    }
}
