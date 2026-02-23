import { useMemo } from 'react';
import { Button } from '@stainless-api/ui-primitives';
import type { Param } from './spec-helpers';
import { InfoIcon } from 'lucide-react';
import { Input } from '@stainless-api/docs-ui/components';

function setHighlight(stainlessPath: string, highlighted: boolean) {
  const ele = document.getElementById(stainlessPath);
  if (!ele) return;
  ele.classList.toggle('stldocs-property-highlighted', highlighted);
  if (highlighted) {
    if (location.hash) {
      const prevScroll = document.documentElement.scrollTop;
      location.hash = '';
      document.documentElement.scrollTop = prevScroll;
    }
    if (document.body.clientWidth >= 1280) {
      ele.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }
}

function htmlToText(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.textContent;
}

export function ParamEditor({ param }: { param: Param }) {
  const type = useMemo(() => htmlToText(param.type), [param.type]);

  return (
    <label className="request-builder-param">
      <Button
        className="request-builder-param-info-button"
        variant="ghost"
        href={`#${encodeURIComponent(param.stainlessPath)}`}
      >
        <Button.Icon icon={InfoIcon} size={16} />
      </Button>

      <span className="request-builder-param-label">{param.key}</span>
      <span className="request-builder-param-colon">:</span>

      <Input
        className="request-builder-param-value"
        onFocus={() => setHighlight(param.stainlessPath, true)}
        onBlur={() => setHighlight(param.stainlessPath, false)}
        placeholder={type}
      />
    </label>
  );
}
