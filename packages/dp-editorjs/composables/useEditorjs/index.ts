import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Table from '@editorjs/table';
import NestedList from '@editorjs/nested-list';
import  Paragraph from '@editorjs/paragraph';
import VariableOptions from './VariableOptions';
import LinkInlineTool from './VariableLink';
import VariableTable from './VariableTable'
export const useEditor = (data) => {


    const editor = useState<any>('editorJS');
    // const data = useState<any>('editorData', () => ({}));
    const variables = useState<string[]>('editorVariable', () => ([]));
    const containerId = useState('editorContainerId', () => ('emailContent'));

    async function createEditor(id:string, formData:any) {
        if(!document.getElementById(id)) return;
        // throw error if no containerId or formData
        if(!id || !formData) {
            throw new Error('containerId or formData is required');
        }
        // dispose if editor is exist

        // set containerId
        containerId.value = id;
        // set data
        // data.value = formData;
        // clean variable
        variables.value = [];
        // set up editor
        editor.value = new EditorJS({
            holderId: containerId.value ,
            autofocus: true,
            data:data.value,
            tools:{
                header: {
                    class: Header,
                    inlineToolbar: true,
                },
                list : {
                    class: NestedList,
                    inlineToolbar: true,
                },
                table:{
                    class: Table,
                    inlineToolbar: true,

                },
                link:{
                    class: LinkInlineTool,
                    config:{
                        variables: variables.value
                    }
                },
                paragraph: {
                    class: Paragraph,
                    inlineToolbar: true,
                    config:{
                        preserveBlanks: true
                    }
                },
                VariableTable: {
                    class: VariableTable,
                    config:{
                        withHeadings: true,
                        variables: variables.value
                    }
                },
                VariableOptions: {
                    class: VariableOptions,
                    config:{
                        variables: variables.value
                    }
                },

            },
            i18n:{
                messages:{
                    toolNames: {
                        "Text": "Text",
                        "Heading": "Heading",
                        "List": "List",
                        "Warning": "Warning",
                        "Checklist": "Checklist",
                        "Quote": "Quote",
                        "Delimiter": "Delimiter",
                        "Table": "Table",
                        "Link": "Link",
                        "Marker": "Marker",
                        "Bold": "Bold",
                        "Italic": "Italic",
                        "InlineCode": "InlineCode",
                    },
                    blockTunes: {
                        "delete": {
                            "Delete": "Delete"
                        },
                        "moveUp": {
                            "Move up": "Move up"
                        },
                        "moveDown": {
                            "Move down": "Move down"
                        }
                    },
                }
            },
            onChange: (api, event) => {

                api.saver.save().then((outputData) => {
                    calculateVariable(outputData);
                });
            },
            onReady:async() => {
                if(data.value.emailTemplateJson) {
                    const json = JSON.parse(data.value.emailTemplateJson);
                    // 不要渲染空的json
                    if(json.blocks.length > 0) {
                        setData(json);
                        // set variable after ready

                    }
                }
                setTimeout(() => {
                    updateVariable()
                }, 200)
            },

        })

    }

    function dispose():void{
        if(editor.value) {
            editor.value.destroy();
        }
        editor.value = null;
    }

    function setData(data:any):void{
        if(!editor.value || !editor.value.render) return;
        editor.value?.render(data);
    }

    function getAllVariablesFromString(str:string):string[] {
        if(!str) return [];
        // get all string between ${} in str
        const regex = /\${(.*?)}/g;
        const matches = str.match(regex);
        const newVariable:string[] = [];
        if(matches) {
            matches.forEach((variable:any) => {
                //check if variable contain ()
                // check variable container ()
                if(variable.includes('(') && variable.includes(')')) {
                    const regex = /\((.*?)\)/g;
                    const matches = variable.match(regex);
                    if(matches) {

                        matches.forEach((variable:any) => {
                            // remove () in variable
                            const nv = variable.replace('(', '').replace(')', '');
                            // split by , and push to first item to newVariable
                            const splitVariable = nv.split(',');
                            if(splitVariable.length > 0) {
                                newVariable.push(splitVariable[0]);
                            }
                            // newVariable.push(splitVariable[0]);
                        })
                    }
                }else{

                    newVariable.push(variable.replace('${', '').replace('}', ''));
                }
            })
        }
        return newVariable;
    }

    async function updateVariable() {
        const data = await editor.value?.save();

        calculateVariable(data);
    }

    function calculateVariable(blockData:any) {
        const newVariable:string[] = [];
        for( const block of blockData.blocks) {
            // switch between differnet type of blocks
            switch (block.type) {
                case 'header':
                    newVariable.push(...getParagraphVariables(block.data.text));
                    break;
                case 'paragraph':
                    newVariable.push(...getParagraphVariables(block.data.text));
                    break;
                case 'list':
                    newVariable.push(...getListVariable(block.data.items));
                    break;
                case 'table':
                    block.data.content.forEach((row:any) => {
                        row.forEach((cell:any) => {
                            newVariable.push(...getParagraphVariables(cell.data.text));
                        })
                    })
                    break;
                case 'VariableTable':
                    newVariable.push(...getVariableTableVariable(block));
                    break;
            }
        }
        // get string if ${} in data.subject
        newVariable.push(...getAllVariablesFromString(data.value.subject));
        //sprint data.To, data.CC, data.BCC by , and check if it is email, if not push to variable

        // variables.value = newVariable;
        // remove duplicate

        variables.value = [... new Set(newVariable)];
        return variables.value
    }

    function getParagraphVariables(text:string){
        const newVariable:string[] = [];
        var t = document.createElement('template');
        t.innerHTML = text
        // found by tag name "var"
        const newsVars = t.content.querySelectorAll('a.ce-text-item');
        newsVars.forEach((variable) => {
            const dataURL = variable.getAttribute('data-url') as string;
            newVariable.push(...getAllVariablesFromString(dataURL));
        });
        const varLink = t.content.querySelectorAll('a.ce-link-item');
        // push data-url to variable
        varLink.forEach((variable) => {
            const dataURL = variable.getAttribute('data-url') as string;
            newVariable.push(...getAllVariablesFromString(dataURL));

        })
        // remove t from memory
        t.remove();
        return newVariable;
    }

    function getVariableTableVariable(block:any):string[] {
        let newVariable:string = block.data.variable;
        const newVariableList:string[] = [];
        block.data.content.forEach((row:any) => {
            row.forEach((cell:any) => {
                // get all variable between ${}
                const regex = /\${(.*?)}/g;
                const matches = cell.matchAll(regex);
                for (const match of matches) {
                    newVariableList.push(match[1]);
                }
            })
        })
        // remove duplicate
        newVariableList.forEach((variable) => {
            if(!newVariable.includes(variable)) {
                newVariable += `,${variable}`;
            }
        })
        return [newVariable];

    }
    function getListVariable(items:any) {
        const returnDate:string[] = [];
        items.forEach((level:any) => {
            returnDate.push(...getParagraphVariables(level.content));

            if(level.items) {
                returnDate.push(...getListVariable(level.items));
            }
        })
        return returnDate;
    }
  async function getData() {
      updateVariable()
      const json = await editor.value?.save();
        let html = '<html><body>'
        for( const block of json.blocks) {
            switch(block.type){
                case 'header':
                    html += `<h${block.data.level}>${htmlToString(block.data.text)}</h${block.data.level}>`;
                    break;
                case 'paragraph':
                    html += `<p>${htmlToString(block.data.text)}</p>`;
                    break;
                case 'list':
                    html += `<ul>${ block.data.items.map( (item:any) => `<li>${htmlToString(item.content)}</li>`) }</ul>`;
                    break;
                case 'table':
                    html += `<table>${blockToTable(block.data.content)}</table>`;
                    break;
                case "VariableTable":
                    html += variableTableBlockToHtml(block);
                    break;
            }

        }
      html += '</body></html>';
      console.log("data", data.value)
        return {
            html,
            json,
            variable: variables.value
        }
    }

    function variableTableBlockToHtml(block:any):string {
        const tableVariable = '${' + block.data.variable + '}';
        const header = block.data.withHeadings ? block.data.content[0] : undefined;
        const body = block.data.withHeadings ? block.data.content[1] : block.data.content[0];
        let html = `
            <table style="border: 1px solid black; border-spacing: 0; border-collapse: collapse;">
             ${ block.data.withHeadings ?
                 `<thead>
                    <tr>${ header.map((header:string) => `<th>${stringToHtml(header)}</th>`).join('')}
                    </tr>
                </thead>

                ` : ''
                }
                <tbody>
                    <tr th:each="model :${tableVariable}">
                        ${body.map((row:any) => `<td>${stringToHtml(row, 'model.')}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        `;
        // check need header

        return html;
    }

    function blockToTable(block:any):string{
        let html = '';
        for( const row of block){
            html += '<tr>';
            for( const cell of row){
                html += `<td>${htmlToString(cell)}</td>`;
            }
            html += '</tr>';
        }
        return html;
    }

    function stringToHtml(str:string, prefix:string = ''):string{
        const regex = /\${(.*?)}/g;
        // check str contain # or ()
        if(str.includes('#') || str.includes('(')) {
            return str.replace(regex, '<span th:text="${' + prefix + '$1}" ></span>');;
        };
        return str.replace(regex, '<span th:utext="${' + prefix + '$1}" ></span>');
    }

    function htmlToString(html:string):string{
        var t = document.createElement('template');
        t.innerHTML = html;

        const varText = t.content.querySelectorAll('a.ce-text-item');
        // replace all var tag with span
        varText.forEach((variable) => {
            const dataURL = variable.getAttribute('data-url') || variable.getAttribute('href') as string;
            console.log(dataURL, variable);
            if(dataURL.includes('#') || dataURL.includes('(')) {
                variable.replaceWith(`<span th:text="${variable.getAttribute('data-url')}"></span>`);
            }
            variable.replaceWith(`<span  th:utext="${variable.getAttribute('data-url')}"></span>`);
        });
        const varLink = t.content.querySelectorAll('a.ce-link-item');

        varLink.forEach((variable) => {
            // variable.setAttribute('href', '${' + variable.getAttribute('data-url') + '}');
            // change href to th:href
            // chceck if data start with  http or https
            const dataURL = variable.getAttribute('data-url');
            if(dataURL?.startsWith('http') || dataURL?.startsWith('https')) {
                variable.replaceWith(`<a href="${variable.getAttribute('data-url')}">${variable.textContent} </a>`);
            } else {
                variable.replaceWith(`<a th:href="${variable.getAttribute('data-url')}">${variable.textContent} </a>`);
            }
        })
        var txt = document.createElement("textarea");
        txt.innerHTML = t.innerHTML;
        const stringHtml = txt.value;
        t.remove();
        txt.remove();
        // wrap html and body tag in stringHtml
        return stringHtml;
    }


    return {
        createEditor,
        dispose,
        setData,
        variables,
        getData,
        updateVariable,
    }


}
