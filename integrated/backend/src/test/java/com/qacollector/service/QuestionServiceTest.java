package com.qacollector.service;

import com.qacollector.dto.SubmitAnswerRequest;
import com.qacollector.entity.Answer;
import com.qacollector.repository.AgeGroupRepository;
import com.qacollector.repository.AnswerRepository;
import com.qacollector.repository.QuestionOptionRepository;
import com.qacollector.repository.QuestionRepository;
import com.qacollector.repository.QuestionTranslationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {
    @Mock QuestionRepository questionRepository;
    @Mock QuestionTranslationRepository translationRepository;
    @Mock QuestionOptionRepository optionRepository;
    @Mock AgeGroupRepository ageGroupRepository;
    @Mock AnswerRepository answerRepository;

    @Test
    void submitAnswersValidatesThenSavesTheWholeBatchOnce() {
        QuestionService service = service();

        int saved = service.submitAnswers(List.of(answer(11L, 32, "1"), answer(12L, 32, "6")));

        assertEquals(2, saved);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<Answer>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(answerRepository).saveAll(captor.capture());
        List<Answer> answers = ((List<Answer>) captor.getValue());
        assertEquals(List.of("1", "6"), answers.stream().map(Answer::getSelectedOption).toList());
    }

    @Test
    void submitAnswersDoesNotWriteWhenAnyAnswerIsInvalid() {
        QuestionService service = service();

        assertThrows(IllegalArgumentException.class,
            () -> service.submitAnswers(List.of(answer(11L, 32, "2"), answer(12L, 32, "9"))));

        verify(answerRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
    }

    private QuestionService service() {
        return new QuestionService(questionRepository, translationRepository, optionRepository,
            ageGroupRepository, answerRepository);
    }

    private SubmitAnswerRequest answer(long questionId, int age, String option) {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setRespondentAge(age);
        request.setSelectedOption(option);
        return request;
    }
}
