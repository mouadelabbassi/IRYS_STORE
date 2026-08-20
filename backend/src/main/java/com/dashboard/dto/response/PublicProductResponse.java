package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicProductResponse {
    private String asin;
    private String productName;
    private String description;
    private BigDecimal price;
    private BigDecimal rating;
    private Integer reviewsCount;
    private Integer ranking;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private Integer stockQuantity;
    private Integer salesCount;
    private Boolean isBestseller;
}
