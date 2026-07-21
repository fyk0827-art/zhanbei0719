package com.qacollector.dto;

import lombok.Data;

import java.util.List;

@Data
public class BatchSubmitAnswersRequest {
    private List<SubmitAnswerRequest> answers;
}
