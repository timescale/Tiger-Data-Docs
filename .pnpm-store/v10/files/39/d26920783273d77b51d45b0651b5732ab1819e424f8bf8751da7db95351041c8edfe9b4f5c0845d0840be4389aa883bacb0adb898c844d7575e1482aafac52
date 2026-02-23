import { StlSidebarEntry } from '@stainless-api/docs-ui/components';
import { SidebarEntry } from '../pagination/util';
import { ReactNode } from 'react';
import { Badge, getHttpMethod } from '@stainless-api/ui-primitives';
import { FunctionIcon } from '@stainless-api/ui-primitives/icons';
import { BracesIcon } from 'lucide-react';

function getIcon(entry: SidebarEntry): ReactNode | undefined {
  if (entry.type !== 'link') {
    return undefined;
  }
  const methodAttr = entry.attrs['data-stldocs-method'];
  const httpMethod = getHttpMethod(methodAttr);
  if (httpMethod) {
    return <Badge.HTTP method={httpMethod} iconOnly size="sm" />;
  }

  // special handling for the webhooks resource overview page
  if (entry.attrs['data-stldocs-overview'] === 'webhooks') {
    return (
      <Badge size="sm" icon={<BracesIcon />} intent="info">
        {''}
      </Badge>
    );
  }

  // Support empty string as method to show generic "Function" badge
  else if (methodAttr === '') {
    return (
      <Badge size="sm" icon={<FunctionIcon />} intent="info">
        {''}
      </Badge>
    );
  }
  return undefined;
}

export function convertAstroSidebarToStl(entries: SidebarEntry[]): StlSidebarEntry[] {
  return entries.map((entry): StlSidebarEntry => {
    if (entry.type === 'link') {
      const icon = getIcon(entry);
      return {
        type: 'link',
        attrs: entry.attrs,
        label: entry.label,
        target: {
          type: 'href',
          href: entry.href,
        },
        isCurrent: entry.isCurrent,
        icon,
      };
    } else {
      return {
        type: 'group',
        label: entry.label,
        collapsed: entry.collapsed,
        entries: convertAstroSidebarToStl(entry.entries),
      };
    }
  });
}
