import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Image,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';

import { insertLessonAttempt } from '@/api/lessons/attempts';
import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { markModuleCompleted } from '@/api/progress';
import * as SafeSpeech from '@/services/tts';
import { useAppTheme } from '@/services/theme/ThemeProvider';

import { theme as baseTheme } from '@/services/theme/tokens';

type Choice = string;
type Question = {
  id: string;
  kind: 'cloze-mcq';
  title: string;
  sentencePrefix: string;
  blankLabel: string; // e.g., "__"
  sentenceSuffix: string;
  choices: Choice[];
  answer: Choice;
};

type Attempt = {
  questionId: string;
  choice: string;
  correct: boolean;
  at: number; // epoch ms
};

export const options = { headerShown: false } as const;

export default function CourseRun() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme, isDark } = useAppTheme();

  // Minimal in-memory lesson for Basics
  const questions = useMemo<Question[]>(
    () => [
      {
        id: 'q1',
        kind: 'cloze-mcq',
        title: 'Fill in the blank',
        sentencePrefix: 'Io',
        blankLabel: '__',
        sentenceSuffix: 'uno studente.',
        choices: ['sono', 'sei', 'è', 'siamo'],
        answer: 'sono',
      },
      {
        id: 'q2',
        kind: 'cloze-mcq',
        title: 'Fill in the blank',
        sentencePrefix: 'Tu',
        blankLabel: '__',
        sentenceSuffix: 'un insegnante.',
        choices: ['è', 'siamo', 'sei', 'sono'],
        answer: 'sei',
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Choice | null>(null);
  const q = questions[index];
  const isLast = index === questions.length - 1;

  // Track attempts for future backend persistence
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const wrongCount = attempts.filter((a) => a.questionId === q.id && !a.correct).length;
  const totalCount = attempts.filter((a) => a.questionId === q.id).length;
  const recordAttempt = (choice: string, isCorrect: boolean) => {
    setAttempts((prev) => [
      ...prev,
      { questionId: q.id, choice, correct: isCorrect, at: Date.now() },
    ]);
    // Fire-and-forget persistence; ignore errors for UX smoothness
    const courseSlug = String(slug || 'basics');
    insertLessonAttempt({
      course_slug: courseSlug,
      question_id: q.id,
      choice,
      correct: isCorrect,
    }).catch(() => {});
  };

  // Animation state
  const sentenceRowRef = useRef<View | null>(null);
  const choicesRef = useRef<View | null>(null);
  const blankRef = useRef<View | null>(null);

  const [sentenceRowPos, setSentenceRowPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [choicesPos, setChoicesPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [blankPos, setBlankPos] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });
  const [choicePos, setChoicePos] = useState<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});

  const [animVisible, setAnimVisible] = useState(false);
  const [animText, setAnimText] = useState('');
  const flyXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flyScale = useRef(new Animated.Value(1)).current;
  const [animating, setAnimating] = useState(false);
  const [hiddenChoice, setHiddenChoice] = useState<string | null>(null);
  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSentenceRowLayout = (e: LayoutChangeEvent) => {
    const { x, y } = e.nativeEvent.layout;
    setSentenceRowPos({ x, y });
  };
  const onChoicesLayout = (e: LayoutChangeEvent) => {
    const { x, y } = e.nativeEvent.layout;
    setChoicesPos({ x, y });
  };
  const onBlankLayout = (e: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    setBlankPos({ x, y, w, h });
  };
  const onChoiceLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    setChoicePos((prev) => ({ ...prev, [key]: { x, y, w, h } }));
  };

  // Clean up speech when leaving the screen
  useEffect(() => {
    return () => {
      try {
        SafeSpeech.stop();
      } catch {}
    };
  }, []);

  // Speak the completed sentence after a correct selection animation
  const speakCompletedSentence = async (answer: string) => {
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      const sentence = `${q.sentencePrefix} ${answer} ${q.sentenceSuffix}`
        .replace(/\s+/g, ' ')
        .trim();
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      await SafeSpeech.speak(sentence, { language: 'it-IT', rate });
    } catch {
      // no-op
    }
  };

  const animateToBlank = (text: string) => {
    const start = choicePos[text];
    if (!start || !blankPos) return false;
    const startX = choicesPos.x + start.x;
    const startY = choicesPos.y + start.y;
    const endX = sentenceRowPos.x + blankPos.x;
    const endY = sentenceRowPos.y + blankPos.y;

    setAnimText(text);
    setAnimVisible(true);
    flyXY.setValue({ x: startX, y: startY });
    flyScale.setValue(1);

    setAnimating(true);
    setHiddenChoice(text);
    Animated.parallel([
      Animated.timing(flyXY, {
        toValue: { x: endX, y: endY },
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(flyScale, {
          toValue: 1.15,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(flyScale, {
          toValue: 1.0,
          duration: 280,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      setAnimating(false);
      setAnimVisible(false);
      setHiddenChoice(null);
      setSelected(text); // now lock in the correct answer
      // After animation completes, speak the sentence
      speakCompletedSentence(text);
    });
    return true;
  };

  const onChoose = (c: Choice) => {
    if ((selected && selected === q.answer) || animating) return; // lock when correct fixed or during animation
    if (c === q.answer) {
      recordAttempt(c, true);
      const ok = animateToBlank(c);
      if (!ok) {
        // Fallback if positions not ready
        setSelected(c);
        speakCompletedSentence(c);
      }
    } else {
      recordAttempt(c, false);
      // Show red feedback briefly, then clear to allow retry
      setSelected(c);
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
      wrongTimeoutRef.current = setTimeout(() => {
        setSelected(null);
      }, 650);
    }
  };

  const onNext = async () => {
    if (!selected) return;
    // Stop any ongoing speech when advancing
    try {
      await SafeSpeech.stop();
    } catch {}
    if (!isLast) {
      setIndex((i) => i + 1);
      setSelected(null);
      setHiddenChoice(null);
      setAnimVisible(false);
    } else {
      // Finish lesson
      // TODO: Persist attempts to backend here
      // console.log('Attempts', attempts);
      if (slug) await markModuleCompleted(String(slug));
      router.replace('/(nav-bar)/home');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top logo */}
        <View style={styles.logoWrap}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.text }]}>{q.title}</Text>

        {/* Dev counter */}
        <Text style={[styles.devCounter, { color: theme.colors.mutedText }]}>
          Wrong: {wrongCount} • Total: {totalCount} • Q {index + 1}/{questions.length}
        </Text>

        {/* Sentence with blank */}
        <View style={styles.sentenceRow} ref={sentenceRowRef} onLayout={onSentenceRowLayout}>
          <Text style={[styles.sentenceText, { color: theme.colors.text }]}>
            {q.sentencePrefix}{' '}
          </Text>
          <View
            ref={blankRef}
            onLayout={onBlankLayout}
            style={[styles.blank, { backgroundColor: isDark ? '#354763' : '#CFE6FF' }]}
          >
            <Text style={[styles.blankText, { color: theme.colors.text }]}>
              {selected === q.answer ? q.answer : q.blankLabel}
            </Text>
          </View>
          <Text style={[styles.sentenceText, { color: theme.colors.text }]}>
            {' '}
            {q.sentenceSuffix}
          </Text>
        </View>

        {/* Choices */}
        <View style={styles.choices} ref={choicesRef} onLayout={onChoicesLayout}>
          {q.choices.map((c) => {
            const isSel = selected === c;
            const isCorrectSel = isSel && c === q.answer;
            const isWrongSel = isSel && c !== q.answer;
            const bg = theme.colors.card;
            const borderColor = isCorrectSel
              ? '#28a745'
              : isWrongSel
                ? '#dc3545'
                : theme.colors.border;
            return (
              <Pressable
                key={c}
                onPress={() => onChoose(c)}
                onLayout={onChoiceLayout(c)}
                style={[
                  styles.choiceBtn,
                  {
                    backgroundColor: bg,
                    borderColor,
                    opacity: hiddenChoice === c && animVisible ? 0 : 1,
                  },
                ]}
              >
                <Text style={[styles.choiceText, { color: theme.colors.text }]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Flying word animation overlay */}
        {animVisible && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: flyXY.x,
              top: flyXY.y,
              transform: [{ scale: flyScale }],
            }}
          >
            <Text style={[styles.choiceText, { color: theme.colors.text }]}>{animText}</Text>
          </Animated.View>
        )}

        {/* Next / Finish */}
        <View style={{ marginTop: baseTheme.spacing.lg }}>
          <Pressable
            disabled={!selected}
            onPress={onNext}
            style={[
              styles.primaryBtn,
              { backgroundColor: selected ? theme.colors.primary : '#9bb8ff' },
            ]}
          >
            <Text style={styles.primaryBtnText}>{isLast ? 'Finish' : 'Next'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: baseTheme.spacing.lg },
  logoWrap: { alignItems: 'center', marginTop: 8, marginBottom: 8 },
  logo: { width: 36, height: 36 },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 28,
    textAlign: 'center',
    marginVertical: baseTheme.spacing.md,
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  sentenceText: { fontFamily: baseTheme.typography.bold, fontSize: 28 },
  blank: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: baseTheme.radius.sm,
  },
  blankText: { fontFamily: baseTheme.typography.bold, fontSize: 28 },
  choices: { marginTop: baseTheme.spacing.xl },
  choiceBtn: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: baseTheme.spacing.md,
  },
  choiceText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: baseTheme.radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontFamily: baseTheme.typography.semiBold },
  devCounter: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: baseTheme.spacing.sm,
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
  },
});
