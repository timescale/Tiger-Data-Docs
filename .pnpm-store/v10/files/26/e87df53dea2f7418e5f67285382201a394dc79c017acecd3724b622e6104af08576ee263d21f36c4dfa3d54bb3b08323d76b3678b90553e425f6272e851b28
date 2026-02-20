import { useState, useMemo, useEffect, useId, useSyncExternalStore, Activity, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@stainless-api/ui-primitives';
import { PlayIcon, RotateCcw } from 'lucide-react';
import { SnippetStainlessIslandPropsSchema } from './props';
import { ParamEditor } from './ParamEditor';
import './styles.css';

function useRequiredChild<T extends Element = Element>(
  parent: Element | null,
  selector: string,
): React.RefObject<T> {
  const elementRef = useMemo(() => {
    const el = parent?.querySelector<T>(selector);
    return el ? { current: el } : null;
  }, [parent, selector]);
  if (!elementRef) throw new Error(`Required child not found: ${selector}`);
  return elementRef;
}

function useSetVisibility(elementRef: React.RefObject<HTMLElement>, visible: boolean) {
  useEffect(() => {
    elementRef.current.style.display = visible ? '' : 'none';
  }, [elementRef, visible]);
}

export default function SnippetStainlessIsland({ parent }: { parent: HTMLElement }) {
  const [expanded, setExpanded] = useState(false);

  const trigger = useRequiredChild<HTMLButtonElement>(parent, '.try-it-footer .try-it-button');
  const codeContainer = useRequiredChild<HTMLElement>(parent, '.stldocs-snippet-code');
  const exampleContainer = useRequiredChild<HTMLElement>(parent, '.stldocs-snippet-multi-response');
  useSetVisibility(codeContainer, !expanded);
  useSetVisibility(exampleContainer, !expanded);
  useSetVisibility(trigger, !expanded);
  // Attach click handler to trigger
  useEffect(() => {
    if (!trigger.current) return;
    const ac = new AbortController();
    trigger.current.addEventListener('click', () => setExpanded(true), { signal: ac.signal });
    return () => ac.abort();
  });

  const requestBuilderContainer = useRequiredChild<HTMLElement>(parent, '.request-builder-container');
  const requestBuilderFooter = useRequiredChild<HTMLElement>(parent, '.request-builder-footer');
  const requestBuilderResponse = useRequiredChild<HTMLElement>(parent, '.request-builder-response');
  const requestBuilderProps = useRequiredChild<HTMLTemplateElement>(parent, '.request-builder-props').current;
  const serializedProps = useSyncExternalStore(
    (cb) => {
      const mutationObserver = new MutationObserver(() => cb());
      mutationObserver.observe(requestBuilderProps, { childList: true });
      return () => mutationObserver.disconnect();
    },
    () => requestBuilderProps.content.textContent,
  );
  const deserializedProps = SnippetStainlessIslandPropsSchema.parse(JSON.parse(serializedProps));
  const groupedParams = Map.groupBy(deserializedProps.params, (p) => p.location);

  const formId = `request-builder-form-${useId()}`;

  return (
    <>
      {createPortal(
        <Activity mode={expanded ? 'visible' : 'hidden'}>
          <form
            onSubmit={(e) => {
              alert('TODO: Submit button clicked');
              e.preventDefault();
            }}
            id={formId}
          >
            {[...groupedParams.entries()].map(([location, params]) => (
              <Fragment key={location}>
                <h4>{location} parameters</h4>
                {params.map((e) => (
                  <ParamEditor param={e} key={e.location + e.key} />
                ))}
              </Fragment>
            ))}
          </form>
        </Activity>,
        requestBuilderContainer.current,
      )}

      {createPortal(
        <Activity mode={expanded ? 'visible' : 'hidden'}>
          <Button variant="ghost" border={true} onClick={() => setExpanded(false)}>
            <Button.Icon icon={RotateCcw} />
          </Button>

          <Button variant="success" className="send-button" type="submit" form={formId}>
            <Button.Label>Send</Button.Label>
            <Button.Icon icon={PlayIcon} />
          </Button>
        </Activity>,
        requestBuilderFooter.current,
      )}

      {createPortal(
        <Activity mode={expanded ? 'visible' : 'hidden'}>
          <div>{/* TODO */}</div>
        </Activity>,
        requestBuilderResponse.current,
      )}
    </>
  );
}
