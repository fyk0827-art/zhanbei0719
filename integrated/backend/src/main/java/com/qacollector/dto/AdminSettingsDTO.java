package com.qacollector.dto;

import lombok.Data;

@Data
public class AdminSettingsDTO {
    private int quizQuestionCount;
    /** mock | live */
    private String paymentMode;
    private boolean facebookPixelEnabled;
    private String facebookPixelId;
    private boolean facebookCapiEnabled;
    private String facebookCapiAccessToken;
    private boolean facebookCapiAccessTokenConfigured;
    private String facebookCapiTestEventCode;
    private String facebookCapiApiVersion;
}
