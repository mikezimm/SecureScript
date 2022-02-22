import * as React from 'react';
import styles from './SecureScript.module.scss';
import { ISecureScriptProps } from './ISecureScriptProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { WebpartBanner } from '';

export default class SecureScript extends React.Component<ISecureScriptProps, {}> {
  public render(): React.ReactElement<ISecureScriptProps> {
    return (
      <div className={ styles.secureScript }>
        <WebpartBanner></WebpartBanner>
        <div>
          Add contents of Script Editor here
        </div>
      </div>
    );
  }
}
