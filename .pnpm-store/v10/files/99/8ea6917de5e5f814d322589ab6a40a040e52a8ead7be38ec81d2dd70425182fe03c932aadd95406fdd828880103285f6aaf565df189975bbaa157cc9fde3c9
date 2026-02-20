import { DropdownButton } from '@stainless-api/ui-primitives';
import { CopyIcon } from 'lucide-react';
import { ChatGPTIcon } from './icons/chat-gpt';
import { ClaudeIcon } from './icons/claude';
import { GeminiIcon } from './icons/gemini';
import { MarkdownIcon } from './icons/markdown';
import { CursorIcon } from './icons/cursor';
import React from 'react';

import { getAIDropdownOptions, type DropdownIcon } from '../../plugin/globalJs/ai-dropdown-options';

const iconMap: { [key in DropdownIcon]: React.ReactNode } = {
  markdown: <MarkdownIcon />,
  copy: <CopyIcon size={16} />,
  claude: <ClaudeIcon />,
  chatgpt: <ChatGPTIcon />,
  gemini: <GeminiIcon />,
  cursor: <CursorIcon />,
};

const { primaryAction, groups } = getAIDropdownOptions();

function ItemLabel({ label }: { label: string[] }) {
  if (label.length > 1) {
    return (
      <DropdownButton.MenuItemText subtle>
        {label[0]}
        <strong>{label[1]}</strong>
      </DropdownButton.MenuItemText>
    );
  }

  return (
    <DropdownButton.MenuItemText>
      <strong>{label[0]}</strong>
    </DropdownButton.MenuItemText>
  );
}

export function AIDropdown() {
  return (
    <DropdownButton data-dropdown-id="ai-dropdown-button">
      <DropdownButton.PrimaryAction>
        {iconMap[primaryAction.icon]}
        <DropdownButton.PrimaryActionText>{primaryAction.label}</DropdownButton.PrimaryActionText>
      </DropdownButton.PrimaryAction>
      <DropdownButton.Trigger />
      <DropdownButton.Menu>
        {groups.map((group) => (
          <React.Fragment key={group.reactKey}>
            {group.options.map((option) => (
              <DropdownButton.MenuItem value={option.id} isExternalLink={option.external} key={option.id}>
                <DropdownButton.Icon>{iconMap[option.icon]}</DropdownButton.Icon>
                <ItemLabel label={option.label} />
              </DropdownButton.MenuItem>
            ))}
            {group.isLast ? null : <hr />}
          </React.Fragment>
        ))}
      </DropdownButton.Menu>
    </DropdownButton>
  );
}
