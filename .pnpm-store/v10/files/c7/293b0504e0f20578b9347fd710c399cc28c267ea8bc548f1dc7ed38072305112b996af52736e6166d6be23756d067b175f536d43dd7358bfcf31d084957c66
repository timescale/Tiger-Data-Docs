import type { LucideIcon } from 'lucide-react';

type CardProps = {
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
  href?: string;
};

export function CardGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="stl-ui-mintlify-compat-card-group" data-stl-ui-element>
      {children}
    </div>
  );
}

export function Card({ icon: Icon, title, children, href, ...rest }: CardProps) {
  const Slot = href ? 'a' : 'div';

  return (
    <Slot className="stl-ui-mintlify-compat-card" href={href} {...rest} data-stl-ui-element>
      {Icon && (
        <span className="stl-ui-mintlify-compat-card-icon">
          <Icon size={22} />
        </span>
      )}
      <h2 className="stl-ui-mintlify-compat-card-title">{title}</h2>
      <div className="stl-ui-mintlify-compat-card-content">{children}</div>
    </Slot>
  );
}
