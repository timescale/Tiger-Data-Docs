import { MethodDescriptionProps } from '@stainless-api/docs-ui/components';
import { useComponents } from '@stainless-api/docs-ui/contexts/use-components';
import style from '@stainless-api/docs-ui/style';
import { Button } from '@stainless-api/ui-primitives';

function shouldCollapseDescription(description: string) {
  const MIN_CHARS = 400;
  const MIN_LINES = 6;

  const lineCount = description.split('\n').length;

  if (description.length >= MIN_CHARS) return true;
  if (lineCount >= MIN_LINES) return true;

  // Markdown structure often means longer content
  if (/#\s/.test(description)) return true; // has headings
  if (/```/.test(description)) return true; // has code blocks
  if (/^\s*[-*]\s+/m.test(description)) return true; // has lists

  return false;
}

export function MethodDescription({ description }: MethodDescriptionProps) {
  const { Markdown } = useComponents();

  if (description) {
    // Attempt to determine if we should make the description collapsible initially
    // or not. If we get this right, there will be no FOUC.
    const collapsible = shouldCollapseDescription(description);

    return (
      <div className="stl-method-description">
        <div
          className={style.MethodDescription}
          data-stldocs-property-group="method-description"
          data-collapsed={collapsible ? 'true' : 'false'}
        >
          <Markdown content={description} />
        </div>
        <div className="stl-method-description-overflow-wrapper">
          <Button
            type="button"
            data-method-description-toggle
            size="sm"
            variant="ghost"
            hidden={!collapsible}
          >
            Show more
          </Button>
        </div>
      </div>
    );
  }
}
