package com.lifeblueprint.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DeepSeekServiceTest {
    @Test
    void promptPinsCurrentDateAndForbidsInventedTransits() {
        String prompt = DeepSeekService.buildPrompt(
            "Release Test", "preview", "{\"birthData\":{}}", LocalDate.of(2026, 7, 22));

        assertTrue(prompt.contains("2026-07-22"));
        assertTrue(prompt.contains("Do not invent current planetary positions, transits"));
        assertTrue(prompt.contains("next-90-day actions"));
        assertTrue(prompt.contains("Do not use Chinese characters"));
        assertFalse(prompt.contains("2025"));
    }

    @Test
    void detectsHanCharactersInOtherwiseEnglishReport() {
        assertTrue(DeepSeekService.containsHan("You are an 情感急救员."));
        assertFalse(DeepSeekService.containsHan("You are an emotional first aid responder."));
        assertFalse(DeepSeekService.containsHan(null));
    }

    @Test
    void repairPromptRequiresCompleteEnglishReportWithoutChangingStructure() {
        String prompt = DeepSeekService.buildEnglishRepairPrompt("# Identity\nYou are an 情感急救员.");

        assertTrue(prompt.contains("every word is in English"));
        assertTrue(prompt.contains("preserving all Markdown headings"));
        assertTrue(prompt.contains("# Identity"));
    }
}
