import * as React from 'react';

import {SPHttpClient, SPHttpClientResponse} from '@microsoft/sp-http';

// const iframePref = "<iframe width='100%' height='100vh' srcdoc='";
// const iframePref = `<iframe width='100%' height='${window.innerHeight}' srcdoc='`;
// const iframeSuff = "\'</iframe>";
const iframePref = ``;
const iframeSuff = "";
const noContent = "<div>No content loaded.</div>";

export async function fetchSnippet( url: string ,  ctx : any ) {

    // https://mcclickster.sharepoint.com/sites/PivotNotInstalled/SiteAssets/Forms/AllItems.aspx
    const tenantCDN = `TestScriptandFiles`;
    let snippetURL = `${window.location.origin}/sites/${tenantCDN}/`;
    snippetURL += `_api/web/getFileByServerRelativeUrl('${url}')/$value`;

    console.log('fetchSnippet url:', snippetURL );
    // const snippetURL = `https://tenant.sharepoint.com/sites/cdn/_api/web/getFileByServerRelativeUrl('${props.url}')/$value`;
    // const snippetURL = props.ctx.pageContext.web.absoluteUrl + `/_api/web/getFileByServerRelativeUrl('${props.url}')/$value`;
    let htmlFragment: string = (url) ? 
    await ctx.spHttpClient.get(snippetURL, SPHttpClient.configurations.v1)
    .then((response: SPHttpClientResponse) => {return response.text();})
    :noContent;

    if ( htmlFragment !== noContent ) {
      //Add an iframe around it
      // htmlFragment = htmlFragment.split("'").join("\'");
      htmlFragment = htmlFragment.split("'").join("\\'");
      htmlFragment = `${iframePref}${htmlFragment}${iframeSuff}`;
    }
    console.log('fetchSnippet script:', htmlFragment );
    return htmlFragment;

  }