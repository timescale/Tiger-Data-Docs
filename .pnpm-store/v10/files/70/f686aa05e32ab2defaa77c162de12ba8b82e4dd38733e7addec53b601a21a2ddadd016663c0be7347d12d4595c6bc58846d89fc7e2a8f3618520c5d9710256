import clsx from 'clsx';
import type { Components } from 'react-markdown';
import styles from '../AiChat.module.css';

export default {
  table(props) {
    const { children, ...rest } = props;

    return (
      <div className={clsx(styles['chat-table'])}>
        <table {...rest}>{children}</table>
      </div>
    );
  },
} satisfies Components;
