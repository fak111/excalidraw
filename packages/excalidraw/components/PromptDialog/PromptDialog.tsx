import { useEffect, useState } from "react";

import { t } from "../../i18n";
import { useUIAppState } from "../../context/ui-appState";
import { useExcalidrawSetAppState } from "../App";
import { Dialog } from "../Dialog";
import DialogActionButton from "../DialogActionButton";

import "./PromptDialog.scss";

const MIN_PROMPT_LENGTH = 3;
const MAX_PROMPT_LENGTH = 1000;

export const PromptDialog = (props: {
  onPromptSubmit(prompt: string): void;
}) => {
  const appState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();

  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<Error | null>(null);

  // 只在对话框打开时渲染
  if (appState.openDialog?.name !== "promptDialog") {
    return null;
  }

  const handleSubmit = () => {
    const trimmedPrompt = prompt.trim();

    // 验证输入
    if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
      console.log(`Prompt is too short (min ${MIN_PROMPT_LENGTH} characters)`);
      setError(new Error(`Prompt is too short (min ${MIN_PROMPT_LENGTH} characters)`));
      return;
    }

    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      setError(new Error(`Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`));
      return;
    }

    // 立即关闭对话框并清空输入
    setAppState({ openDialog: null });
    setPrompt("");
    setError(null);
    
    // 异步调用提交处理，不等待结果
    props.onPromptSubmit(trimmedPrompt);
  };

  const handleClose = () => {
    setAppState({ openDialog: null });
    setPrompt("");
    setError(null);
  };

  const canSubmit = prompt.trim().length >= MIN_PROMPT_LENGTH &&
    prompt.trim().length <= MAX_PROMPT_LENGTH;

  return (
    <Dialog
      onCloseRequest={handleClose}
      title={t("promptDialog.title")}
      className="prompt-dialog"
      size="wide"
    >
      <div className="prompt-dialog-content">
        <div className="prompt-dialog-description">
          {t("promptDialog.description")}
        </div>

        <textarea
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
            if (error) setError(null);
          }}
          placeholder={t("promptDialog.placeholder")}
          rows={6}
          autoFocus
          className="prompt-dialog-input"
        />

        {error && (
          <div className="prompt-dialog-error">
            {error.message}
          </div>
        )}

        <div className="prompt-dialog-char-count">
          {prompt.length} / {MAX_PROMPT_LENGTH}
        </div>
      </div>

      <div className="prompt-dialog-actions">
        <DialogActionButton
          label={t("buttons.cancel")}
          onClick={handleClose}
        />
        <DialogActionButton
          label={t("buttons.submit")}
          onClick={handleSubmit}
          actionType="primary"
          disabled={!canSubmit}
        />
      </div>
    </Dialog>
  );
};
