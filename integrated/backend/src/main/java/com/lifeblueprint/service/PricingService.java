package com.lifeblueprint.service;

import com.lifeblueprint.config.PaymentProperties;
import com.qacollector.entity.AgeGroup;
import com.qacollector.repository.AgeGroupRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PricingService {
    private final AgeGroupRepository ageGroups;
    private final PaymentProperties fallbackProperties;

    public PricingService(AgeGroupRepository ageGroups, PaymentProperties fallbackProperties) {
        this.ageGroups = ageGroups;
        this.fallbackProperties = fallbackProperties;
    }

    public BigDecimal currentPrice() {
        return ageGroups.findAllByOrderBySortOrderAsc().stream()
            .map(AgeGroup::getPrice)
            .filter(price -> price != null && price.signum() > 0)
            .findFirst()
            .orElse(BigDecimal.valueOf(fallbackProperties.getOrderAmount(), 2));
    }

    public int currentAmountCents() {
        return currentPrice().movePointRight(2).setScale(0, RoundingMode.HALF_UP).intValueExact();
    }
}
