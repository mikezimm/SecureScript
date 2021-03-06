import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version, DisplayMode } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";

import { IPropertyPaneConfiguration, IPropertyPaneField, 
  PropertyPaneTextField, PropertyPaneToggle } from "@microsoft/sp-property-pane";

import * as strings from 'SecureScriptWebPartStrings';
import SecureScript from './componentsOOTB/SecureScript';
import { ISecureScriptProps } from './componentsOOTB/ISecureScriptProps';

import { SPComponentLoader } from '@microsoft/sp-loader';

import { IScriptEditorProps } from './components/IScriptEditorProps';
import PropertyPaneLogo from './PropertyPaneLogo';

import { loadHTMLFile } from './LoadHTML';
import { fetchSnippet } from './loadDangerous';

export interface IScriptEditorWebPartProps {
  script: string;
  title: string;
  removePadding: boolean;
  spPageContextInfo: boolean;
  teamsContext: boolean;
}

export default class SecureScriptWebPart extends BaseClientSideWebPart<IScriptEditorWebPartProps> {

  public _propertyPaneHelper;
  private _unqiueId;

  constructor() {
      super();
      this.scriptUpdate = this.scriptUpdate.bind(this);
      console.log('Secure trace:  constructor');

  }

  public async scriptUpdate(_property: string, _oldVal: string, newVal: string) {
      console.log('Secure trace:  scriptUpdate');
      let updatedSnippet = await fetchSnippet( '/sites/TestScriptandFiles/SiteAssets/SimpleSample.html', this.context );
      this.properties.script = updatedSnippet;
      this._propertyPaneHelper.initialValue = updatedSnippet;
    //   this.properties.script = newVal;
    //   this._propertyPaneHelper.initialValue = newVal;
  }

//   public render(): void {
  public async render() {
    let start = new Date();

    console.log('Secure trace:  render');
    let updatedSnippet = await fetchSnippet( '/sites/TestScriptandFiles/SiteAssets/SimpleSample.html', this.context );
      this._unqiueId = this.context.instanceId;
      if (this.displayMode == DisplayMode.Read) {
          if (this.properties.removePadding) {
              let element = this.domElement.parentElement;
              // check up to 5 levels up for padding and exit once found
              for (let i = 0; i < 5; i++) {
                  const style = window.getComputedStyle(element);
                  const hasPadding = style.paddingTop !== "0px";
                  if (hasPadding) {
                      element.style.paddingTop = "0px";
                      element.style.paddingBottom = "0px";
                      element.style.marginTop = "0px";
                      element.style.marginBottom = "0px";
                  }
                  element = element.parentElement;
              }
          }

          ReactDom.unmountComponentAtNode(this.domElement);
        //   this.domElement.innerHTML = this.properties.script;
          this.domElement.innerHTML = updatedSnippet;
          this.executeScript(this.domElement);
      } else {
          this.renderEditor();
      }
      let end = new Date();
      console.log('Time to laod', end.getTime() - start.getTime() );
  }

  private async renderEditor() {
        console.log('Secure trace:  renderEditor');
      // Dynamically load the editor pane to reduce overall bundle size
      const editorPopUp = await import(
          /* webpackChunkName: 'scripteditor' */
          './components/ScriptEditor'
      );
      const element: React.ReactElement<IScriptEditorProps> = React.createElement(
          editorPopUp.default,
          {
              script: this.properties.script,
              title: this.properties.title,
              propPaneHandle: this.context.propertyPane,
              key: "pnp" + new Date().getTime()
          }
      );
      ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
      return Version.parse('1.0');
  }

  protected async loadPropertyPaneResources(): Promise<void> {
        console.log('Secure trace:  loadPropertyPaneResources');
      //import { PropertyFieldCodeEditor, PropertyFieldCodeEditorLanguages } from '@pnp/spfx-property-controls/lib/PropertyFieldCodeEditor';
      const editorProp = await import(
          /* webpackChunkName: 'scripteditor' */
          '@pnp/spfx-property-controls/lib/PropertyFieldCodeEditor'
      );

      this._propertyPaneHelper = editorProp.PropertyFieldCodeEditor('scriptCode', {
          label: 'Edit HTML Code',
          panelTitle: 'Edit HTML Code',
          initialValue: this.properties.script,
          onPropertyChange: this.scriptUpdate,
          properties: this.properties,
          disabled: false,
          key: 'codeEditorFieldId',
          language: editorProp.PropertyFieldCodeEditorLanguages.HTML
      });
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    console.log('Secure trace:  getPropertyPaneConfiguration');
      let webPartOptions: IPropertyPaneField<any>[] = [
          PropertyPaneTextField("title", {
              label: "Title to show in edit mode",
              value: this.properties.title
          }),
          PropertyPaneToggle("removePadding", {
              label: "Remove top/bottom padding of web part container",
              checked: this.properties.removePadding,
              onText: "Remove padding",
              offText: "Keep padding"
          }),
          PropertyPaneToggle("spPageContextInfo", {
              label: "Enable classic _spPageContextInfo",
              checked: this.properties.spPageContextInfo,
              onText: "Enabled",
              offText: "Disabled"
          }),
          this._propertyPaneHelper
      ];

      if (this.context.sdks.microsoftTeams) {
          let config = PropertyPaneToggle("teamsContext", {
              label: "Enable teams context as _teamsContexInfo",
              checked: this.properties.teamsContext,
              onText: "Enabled",
              offText: "Disabled"
          });
          webPartOptions.push(config);
      }
      webPartOptions.push(new PropertyPaneLogo());

      return {
          pages: [
              {
                  groups: [
                      {
                          groupFields: webPartOptions
                      }
                  ]
              }
          ]
      };
  }


  private evalScript(elem) {
        console.log('Secure trace:  evalScript');
      const data = (elem.text || elem.textContent || elem.innerHTML || "");
      const headTag = document.getElementsByTagName("head")[0] || document.documentElement;
      const scriptTag = document.createElement("script");

      for (let i = 0; i < elem.attributes.length; i++) {
          const attr = elem.attributes[i];
          // Copies all attributes in case of loaded script relies on the tag attributes
          if(attr.name.toLowerCase() === "onload"  ) continue; // onload handled after loading with SPComponentLoader
          scriptTag.setAttribute(attr.name, attr.value);
      }

      // set a bogus type to avoid browser loading the script, as it's loaded with SPComponentLoader
      scriptTag.type = (scriptTag.src && scriptTag.src.length) > 0 ? "pnp" : "text/javascript";
      // Ensure proper setting and adding id used in cleanup on reload
      scriptTag.setAttribute("pnpname", this._unqiueId);

      try {
          // doesn't work on ie...
          scriptTag.appendChild(document.createTextNode(data));
      } catch (e) {
          // IE has funky script nodes
          scriptTag.text = data;
      }

      headTag.insertBefore(scriptTag, headTag.firstChild);
  }

  private nodeName(elem, name) {
    console.log('Secure trace:  nodeName');
      return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
  }

  // Finds and executes scripts in a newly added element's body.
  // Needed since innerHTML does not run scripts.
  //
  // Argument element is an element in the dom.
  private async executeScript(element: HTMLElement) {
        console.log('Secure trace:  executeScript');
      // clean up added script tags in case of smart re-load
      const headTag = document.getElementsByTagName("head")[0] || document.documentElement;
      let scriptTags = headTag.getElementsByTagName("script");
      for (let i = 0; i < scriptTags.length; i++) {
          const scriptTag = scriptTags[i];
          if(scriptTag.hasAttribute("pnpname") && scriptTag.attributes["pnpname"].value == this._unqiueId ) {
              headTag.removeChild(scriptTag);
          }
      }

      if (this.properties.spPageContextInfo && !window["_spPageContextInfo"]) {
          window["_spPageContextInfo"] = this.context.pageContext.legacyPageContext;
      }

      if (this.properties.teamsContext && !window["_teamsContexInfo"]) {
          window["_teamsContexInfo"] = this.context.sdks.microsoftTeams.context;
      }

      // Define global name to tack scripts on in case script to be loaded is not AMD/UMD
      (<any>window).ScriptGlobal = {};

      // main section of function
      const scripts = [];
      const children_nodes = element.getElementsByTagName("script");

      for (let i = 0; children_nodes[i]; i++) {
          const child: any = children_nodes[i];
          if (!child.type || child.type.toLowerCase() === "text/javascript") {
              scripts.push(child);
          }
      }

      const urls = [];
      const onLoads = [];
      for (let i = 0; scripts[i]; i++) {
          const scriptTag = scripts[i];
          if (scriptTag.src && scriptTag.src.length > 0) {
              urls.push(scriptTag.src);
          }
          if (scriptTag.onload && scriptTag.onload.length > 0) {
              onLoads.push(scriptTag.onload);
          }
      }

      let oldamd = null;
      if (window["define"] && window["define"].amd) {
          oldamd = window["define"].amd;
          window["define"].amd = null;
      }

      for (let i = 0; i < urls.length; i++) {
         let scriptUrl: any = [];
         let prefix = '';
          try {
            scriptUrl = urls[i];
              // Add unique param to force load on each run to overcome smart navigation in the browser as needed
              prefix = scriptUrl.indexOf('?') === -1 ? '?' : '&';
              scriptUrl += prefix + 'pnp=' + new Date().getTime();
              await SPComponentLoader.loadScript(scriptUrl, { globalExportsName: "ScriptGlobal" });
          } catch (error) {
            console.log('Secure trace:  error executeScript-prefix ', prefix);
            console.log('Secure trace:  error executeScript-scriptUrl ', scriptUrl);
              if (console.error) {
                  console.error(error);
              }
          }
      }
      if (oldamd) {
          window["define"].amd = oldamd;
      }

      for (let i = 0; scripts[i]; i++) {
          const scriptTag = scripts[i];
          if (scriptTag.parentNode) { scriptTag.parentNode.removeChild(scriptTag); }
          console.log('Secure trace:  evalScript ' + i, scripts[i]);

          this.evalScript(scripts[i]);
      }
      // execute any onload people have added
      for (let i = 0; onLoads[i]; i++) {
          onLoads[i]();
      }
  }
}
