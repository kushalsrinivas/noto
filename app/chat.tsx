import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { searchSimilarNotes } from "@/lib/embeddings";
import { complete, isLlmModelDownloaded, isLlmSupported } from "@/lib/llama";
import { useNotes } from "@/store/app-store";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  referencedNotes?: { id: string; title: string }[];
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function ChatScreen() {
  const colors = useColors();
  const { notes } = useNotes();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const canChat = isLlmSupported() && isLlmModelDownloaded();

  const handleSend = useCallback(async () => {
    const query = input.trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const placeholderId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: placeholderId, role: "assistant", content: "" },
    ]);

    try {
      const results = await searchSimilarNotes(query, notes, 3);

      const contextBlocks = results
        .map(
          (r) =>
            `--- Note: "${r.note.title || "Untitled"}" ---\n${r.note.content.slice(0, 800)}`,
        )
        .join("\n\n");

      const systemPrompt = contextBlocks
        ? `You are a helpful assistant that answers questions based on the user's notes. Use the following notes as context to answer the question. If the notes don't contain relevant information, say so honestly.\n\nContext:\n${contextBlocks}`
        : `You are a helpful assistant. The user has ${notes.length} notes but none are directly relevant. Answer their question as best you can, and let them know if their notes don't cover the topic.`;

      const referencedNotes = results.map((r) => ({
        id: r.note.id,
        title: r.note.title || "Untitled",
      }));

      let accumulated = "";
      await complete(systemPrompt, query, (token) => {
        accumulated += token;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? { ...m, content: accumulated, referencedNotes }
              : m,
          ),
        );
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content: accumulated || "I couldn't generate a response.",
                referencedNotes,
              }
            : m,
        ),
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId ? { ...m, content: `Error: ${errorMsg}` } : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, notes]);

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          msgStyles.row,
          isUser ? msgStyles.userRow : msgStyles.assistantRow,
        ]}
      >
        <View
          style={[
            msgStyles.bubble,
            isUser
              ? [msgStyles.userBubble, { backgroundColor: colors.ink }]
              : [
                  msgStyles.assistantBubble,
                  { backgroundColor: colors.paper2, borderColor: colors.rule },
                ],
          ]}
        >
          <ThemedText
            style={[
              msgStyles.text,
              { color: isUser ? colors.background : colors.ink },
            ]}
          >
            {item.content || "\u2026"}
          </ThemedText>
        </View>
        {!isUser &&
          item.referencedNotes &&
          item.referencedNotes.length > 0 &&
          item.content && (
            <View style={msgStyles.refsRow}>
              <ThemedText
                style={[msgStyles.refsLabel, { color: colors.textTertiary }]}
              >
                Sources:
              </ThemedText>
              {item.referencedNotes.map((ref) => (
                <Pressable
                  key={ref.id}
                  onPress={() => router.push(`/note/${ref.id}`)}
                  style={[msgStyles.refChip, { borderColor: colors.rule }]}
                >
                  <MaterialIcons
                    name="article"
                    size={10}
                    color={colors.textSecondary}
                  />
                  <ThemedText
                    style={[msgStyles.refText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {ref.title}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Chat",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <MaterialIcons name="arrow-back" size={24} color={colors.ink} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {!canChat ? (
          <View style={styles.unavailable}>
            <MaterialIcons name="chat" size={40} color={colors.muted} />
            <ThemedText
              style={[styles.unavailableTitle, { color: colors.textSecondary }]}
            >
              Chat unavailable
            </ThemedText>
            <ThemedText
              style={[styles.unavailableDesc, { color: colors.textTertiary }]}
            >
              Download the AI model from the home screen to start chatting with
              your notes.
            </ThemedText>
          </View>
        ) : (
          <>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={[
                styles.messagesList,
                messages.length === 0 && styles.emptyList,
              ]}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <MaterialIcons name="chat" size={40} color={colors.muted} />
                  <ThemedText
                    style={[
                      styles.emptyChatTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Ask about your notes
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.emptyChatDesc,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Ask questions and get answers based on the content of your{" "}
                    {notes.length} {notes.length === 1 ? "note" : "notes"}.
                  </ThemedText>
                </View>
              }
            />

            <View
              style={[
                styles.inputBar,
                {
                  borderTopColor: colors.ruleLight,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your notes\u2026"
                placeholderTextColor={colors.muted}
                style={[
                  styles.textInput,
                  {
                    color: colors.ink,
                    backgroundColor: colors.paper2,
                    borderColor: colors.rule,
                  },
                ]}
                multiline
                maxLength={500}
                editable={!isLoading}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                blurOnSubmit
              />
              <Pressable
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      input.trim() && !isLoading ? colors.ink : colors.rule,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size={16} color={colors.background} />
                ) : (
                  <MaterialIcons
                    name="arrow-upward"
                    size={18}
                    color={colors.background}
                  />
                )}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: {
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing["5xl"],
  },
  emptyChatTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 18,
  },
  emptyChatDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 280,
  },
  unavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  unavailableTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 18,
  },
  unavailableDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 280,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});

const msgStyles = StyleSheet.create({
  row: {
    marginBottom: Spacing.lg,
  },
  userRow: {
    alignItems: "flex-end",
  },
  assistantRow: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  userBubble: {
    borderBottomRightRadius: BorderRadius.sm,
  },
  assistantBubble: {
    borderBottomLeftRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  text: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  refsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  refsLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
  },
  refChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 150,
  },
  refText: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
    flexShrink: 1,
  },
});
