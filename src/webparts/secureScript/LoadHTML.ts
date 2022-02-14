import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";


export async function loadHTMLFile ( htmlPath: string ) {
    const testLocation = '/sites/TenantCDN/SecureScriptSample/Project1/Example.html';
    try {
        const text: string = await sp.web.getFileByServerRelativeUrl(testLocation).getText();
        console.log('Loading this text:');
        console.log(text);
    } catch (e) {
        console.log('loadHTMLFile Error');
        console.log( e );
    }

}