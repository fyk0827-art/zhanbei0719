package com.qacollector.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PublicSettingsDTO {
    private int quizQuestionCount;
    private BigDecimal reportPrice;
    private boolean facebookPixelEnabled;
    private String facebookPixelId;
}
