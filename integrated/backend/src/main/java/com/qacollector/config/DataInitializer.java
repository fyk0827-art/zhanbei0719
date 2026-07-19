package com.qacollector.config;

import com.qacollector.entity.*;
import com.qacollector.repository.*;
import com.qacollector.service.ReportPromptService;
import com.qacollector.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    public static final String KEY_FEELING_SCALE_V1 = "feeling_scale_v1";

    private final AgeGroupRepository ageGroupRepository;
    private final AdminUserRepository adminUserRepository;
    private final QuestionRepository questionRepository;
    private final QuestionTranslationRepository translationRepository;
    private final QuestionOptionRepository optionRepository;
    private final AnswerRepository answerRepository;
    private final AppSettingRepository appSettingRepository;
    private final BCryptPasswordEncoder encoder;
    private final SettingsService settingsService;
    private final ReportPromptService reportPromptService;
    private final AdminInitProperties adminInitProperties;

    @Override
    @Transactional
    public void run(String... args) {
        settingsService.seedDefaults();
        reportPromptService.seedDefaults();
        initAgeGroups();
        initAdminUser();
        initFeelingScaleQuestions();
    }

    private void initAgeGroups() {
        if (ageGroupRepository.count() > 0) return;

        BigDecimal unifiedPrice = new BigDecimal("9.99");
        List<AgeGroup> groups = List.of(
            createAgeGroup("Children (3-12)", 3, 12, unifiedPrice, 1),
            createAgeGroup("Teenagers (13-17)", 13, 17, unifiedPrice, 2),
            createAgeGroup("Young Adults (18-25)", 18, 25, unifiedPrice, 3),
            createAgeGroup("Adults (26-40)", 26, 40, unifiedPrice, 4),
            createAgeGroup("Middle-aged (41-60)", 41, 60, unifiedPrice, 5),
            createAgeGroup("Seniors (60+)", 60, 120, unifiedPrice, 6)
        );
        ageGroupRepository.saveAll(groups);
    }

    private AgeGroup createAgeGroup(String name, int min, int max, BigDecimal price, int order) {
        AgeGroup g = new AgeGroup();
        g.setName(name);
        g.setMinAge(min);
        g.setMaxAge(max);
        g.setPrice(price);
        g.setSortOrder(order);
        g.setCreatedAt(LocalDateTime.now());
        return g;
    }

    private void initAdminUser() {
        if (adminUserRepository.count() > 0) return;

        String username = adminInitProperties.getUsername();
        String password = adminInitProperties.getPassword();
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        AdminUser admin = new AdminUser();
        admin.setUsername(username.trim());
        admin.setDisplayName("Super Admin");
        admin.setPasswordHash(encoder.encode(password));
        admin.setRole("super_admin");
        admin.setIsActive(true);
        admin.setCreatedAt(now);
        admin.setUpdatedAt(now);
        adminUserRepository.save(admin);
    }

    /**
     * One-time upgrade: replace legacy ABCD samples with the 20-item bipolar feeling scale
     * for every age group. Marked by app_settings.feeling_scale_v1.
     */
    private void initFeelingScaleQuestions() {
        if (appSettingRepository.existsById(KEY_FEELING_SCALE_V1)) {
            return;
        }

        // Clear legacy quiz data so the new scale owns the bank
        answerRepository.deleteAll();
        optionRepository.deleteAll();
        translationRepository.deleteAll();
        questionRepository.deleteAll();

        List<AgeGroup> groups = ageGroupRepository.findAll();
        for (AgeGroup group : groups) {
            for (FeelingScaleSeedData.Item item : FeelingScaleSeedData.ITEMS) {
                createBipolarQuestion(group.getId(), item);
            }
        }

        AppSetting flag = new AppSetting();
        flag.setSettingKey(KEY_FEELING_SCALE_V1);
        flag.setSettingValue("1");
        flag.setPublicVisible(false);
        flag.setDescription("Feeling-scale bipolar bank seeded (v1)");
        flag.setUpdatedAt(LocalDateTime.now());
        appSettingRepository.save(flag);

        // Ensure quiz shows all 20
        settingsService.forceQuizQuestionCount(20);
    }

    private void createBipolarQuestion(Long ageGroupId, FeelingScaleSeedData.Item item) {
        Question q = new Question();
        q.setAgeGroupId(ageGroupId);
        q.setIsActive(true);
        q.setCreatedAt(LocalDateTime.now());
        q.setUpdatedAt(LocalDateTime.now());
        q = questionRepository.save(q);
        Long qId = q.getId();

        QuestionTranslation en = new QuestionTranslation();
        en.setQuestionId(qId);
        en.setLanguageCode("en");
        en.setTitle(item.title());
        en.setDescription(item.chapter());
        translationRepository.save(en);

        QuestionOption left = new QuestionOption();
        left.setQuestionId(qId);
        left.setOptionKey("A");
        left.setOptionText(item.left());
        optionRepository.save(left);

        QuestionOption right = new QuestionOption();
        right.setQuestionId(qId);
        right.setOptionKey("B");
        right.setOptionText(item.right());
        optionRepository.save(right);
    }
}
