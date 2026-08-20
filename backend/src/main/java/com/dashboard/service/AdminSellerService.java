package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminSellerService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final BannedEmailRepository bannedEmailRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private User getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
        if (user.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Only admins can access this resource");
        }
        return user;
    }

    @Transactional
    public void verifySeller(Long sellerId) {
        User admin = getCurrentAdmin();
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        if (seller.getRole() != User.Role.SELLER) {
            throw new ResourceNotFoundException("Seller", "id", sellerId);
        }

        seller.setIsVerifiedSeller(true);
        userRepository.save(seller);

        log.info("Admin {} verified seller {}", admin.getEmail(), seller.getEmail());
    }

    @Transactional
    public void unverifySeller(Long sellerId) {
        User admin = getCurrentAdmin();
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        if (seller.getRole() != User.Role.SELLER) {
            throw new ResourceNotFoundException("Seller", "id", sellerId);
        }

        seller.setIsVerifiedSeller(false);
        userRepository.save(seller);

        entityManager.createQuery(
                        "UPDATE Product p SET p.approvalStatus = :status WHERE p.seller.id = :sellerId")
                .setParameter("status", Product.ApprovalStatus.PENDING)
                .setParameter("sellerId", sellerId)
                .executeUpdate();

        log.info("Admin {} unverified seller {}", admin.getEmail(), seller.getEmail());
    }

    @Transactional
    public void deactivateSeller(Long sellerId) {
        User admin = getCurrentAdmin();
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        if (seller.getRole() != User.Role.SELLER) {
            throw new ResourceNotFoundException("Seller", "id", sellerId);
        }

        String sellerEmail = seller.getEmail();
        log.info("=== DEACTIVATION START:  {} (ID: {}) by admin {} ===",
                sellerEmail, sellerId, admin.getEmail());

        try {
            log.info("Step 1: Deleting product reviews...");
            entityManager.createNativeQuery(
                            "DELETE FROM product_reviews pr " +
                                    "USING products p " +
                                    "WHERE pr.product_asin = p.asin AND p.seller_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();

            entityManager.createNativeQuery(
                            "DELETE FROM product_reviews WHERE user_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();

            log.info("Step 1 completed: Reviews deleted");

            log.info("Step 2: Deleting seller revenues...");
            entityManager.createNativeQuery(
                            "DELETE FROM seller_revenues WHERE seller_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();
            log.info("Step 2 completed: Revenues deleted");

            log.info("Step 3: Deleting seller stock and stock-update requests...");
            entityManager.createNativeQuery(
                            "UPDATE stock_update_requests SET reviewed_by = NULL WHERE reviewed_by = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();

            entityManager.createNativeQuery(
                            "DELETE FROM stock_update_requests WHERE seller_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();

            entityManager.createNativeQuery(
                            "DELETE FROM seller_stock WHERE seller_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();
            log.info("Step 3 completed: Stock and stock-update requests deleted");

            log.info("Step 4: Deleting product requests...");
            entityManager.createNativeQuery(
                            "UPDATE seller_product_requests SET reviewed_by = NULL WHERE reviewed_by = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();

            entityManager.createNativeQuery(
                            "DELETE FROM seller_product_requests WHERE seller_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();
            log.info("Step 4 completed: Product requests deleted");

            log.info("Step 5: Deleting notifications...");
            entityManager.createNativeQuery(
                            "DELETE FROM notifications WHERE recipient_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();
            log.info("Step 5 completed: Notifications deleted");

            log.info("Step 6: Handling products with order history...");
            entityManager.createNativeQuery(
                            "UPDATE order_items SET seller_id = NULL WHERE seller_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();

            entityManager.createNativeQuery(
                            "UPDATE platform_revenue SET seller_id = NULL WHERE seller_id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();

            entityManager.createNativeQuery(
                            "UPDATE products p SET seller_id = NULL, approval_status = 'PENDING', " +
                                    "product_name = CONCAT('[DELETED SELLER] ', p.product_name) " +
                                    "WHERE p.seller_id = :sellerId AND p.asin IN " +
                                    "(SELECT DISTINCT oi.product_asin FROM order_items oi)")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();
            log.info("Step 6 completed: Products with orders orphaned");

            log.info("Step 7: Deleting products without order history...");
            entityManager.createNativeQuery(
                            "DELETE FROM products WHERE seller_id = :sellerId AND asin NOT IN " +
                                    "(SELECT DISTINCT product_asin FROM order_items)")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();
            log.info("Step 7 completed: Products without orders deleted");

            log.info("Step 8: Banning email...");
            BannedEmail bannedEmail = BannedEmail.builder()
                    .email(sellerEmail)
                    .reason("Account deactivated for violating platform policies")
                    .bannedBy(admin.getId())
                    .build();
            bannedEmailRepository.save(bannedEmail);
            entityManager.flush();
            log.info("Step 8 completed: Email {} banned", sellerEmail);

            log.info("Step 9: Deleting user account...");
            entityManager.createNativeQuery(
                            "DELETE FROM users WHERE id = :sellerId")
                    .setParameter("sellerId", sellerId)
                    .executeUpdate();
            log.info("Step 9 completed: User deleted");

            entityManager.flush();
            log.info("=== DEACTIVATION COMPLETE: {} ===", sellerEmail);

        } catch (Exception e) {
            log.error("=== DEACTIVATION FAILED for {}: {} ===", sellerEmail, e.getMessage(), e);
            throw new BadRequestException("Failed to deactivate seller: " + e.getMessage());
        }
    }

    public boolean isEmailBanned(String email) {
        return bannedEmailRepository.existsByEmail(email);
    }
}
