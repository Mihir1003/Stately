import { exec as Exec } from "child_process";
import { promisify } from "util";
import {xml2js} from "xml-js";
const exec = promisify(Exec);
import {v4} from "uuid";
import { StateEnteredEventDetails } from "@aws-sdk/client-sfn";

type Node = {
    name: string;
    children: Node[];
    attribute?: string; 
};


type commonState = {
    Type: string;
    Scope: string;
}


type TaskState = {
    Type: "Task";
    Resource: ValueState;
    Inputs: ValueState[];
} & commonState

type WaitState = {
    Type: "Wait";
    Seconds: ValueState;
} & commonState

type ValueState = {
    Type: "Pass";
    Value: any;
} & commonState

type FailState = {
    Type: "Fail";
} & commonState

type SucceedState = {
    Type: "Succeed";
} & commonState

type State = TaskState | WaitState | ValueState | FailState | SucceedState;


function toState(node : Node) : State  {
    switch (node.name) {
        case "ATask":
            return {
                Type: "Task",
                Resource: toValueState(node.children[0]),
                Inputs: node.children.slice(1).map(toValueState),
                Scope : "main"
            }
        case "AWait":
            return {
                Type: "Wait",
                Seconds: toValueState(node.children[0]),
                Scope : "main"
            }
        case "AFail":
            return {
                Type: "Fail",
                Scope : "main"

            }
        case "ASucceed":
            return {
                Type: "Succeed",
                Scope : "main"

            }
        default:
            console.log(node)
            throw Error("Invalid State"+ JSON.stringify(node))
    }
}

function toValueState(node : Node) : ValueState {

    switch (node.name) {
        case "String":
            return {
                Type: "Pass",
                Value: node.attribute,
                Scope : "main"
            }
        case "Integer":
            return {
                Type: "Pass",
                Value: parseInt(node.attribute || ""),
                Scope : "main"
            }
        case "Boolean":
            return {
                Type: "Pass",
                Value: node.attribute === "true",
                Scope : "main"
            }
            default:
                console.log(node)
                throw Error("Invalid Value State"+ JSON.stringify(node))}
}


async function main() {
    const executable = "parser/StatelyXMLPrinter";
    const executableArgs = "src/sample_test";
    const test = await exec(`${executable} ${executableArgs}`);
    console.log(test.stdout);


    let result = xml2js(test.stdout);    // to convert xml text to javascript object
    // console.log(JSON.stringify(result));

    // convert json to node
    function toNode(json: any): Node {
        const node: Node = {
            name: json.name,
            children: [],
            attribute: json.attributes ? json.attributes.value : undefined,
        };
        if (json.elements) {
            for (const child of json.elements) {
         
                if (["VString","VNumber","VBoolean"].includes(child.name)) {
                    console.log(child.elements[0].name)
                    node.children.push(toNode(child.elements[0]));
                }
                else {
                    console.log(child.name)
                    node.children.push(toNode(child));
                }
            }
        }
        return node;
    }
    
    const node = toNode(result);
    console.log(JSON.stringify(node.children[0], null, 2));


    let actions : Node[]= []

    let getActions = (node: Node) => {

        if (node.name.startsWith("A")) {
            actions.push(node);
            return
        }
        for (let i = 0; i< node.children.length; i++) {
            // console.log(node.children[i].name);
            getActions(node.children[i]);
        }}

    getActions(node.children[0])

    console.log(actions);

    for (let i = 0; i< actions.length; i++) {
        console.log(toState(actions[i]));
    }


    // let sort = (node: Node) => {
    //     for (let i = 0; i< node.children.length; i++) {
    //         console.log(node.children[i].name);
    //         sort(node.children[i]);
    //     }
    //     if (!["E","Eaction"].includes(node.name)) {
    //         sortArr.push(node);    
    //     }
    // }
    // sort(node)
    // console.log(sortArr);



    // let variableTable = new Map<number,[string, string]>();

    let passStringConstruct = (stateName  :string,varName : string,varVal  :string,scope : string,nextState : string)=> `
        "${stateName}": {
            "Type": "Pass",
            "Result": {
            "${varName}" : "${varVal}"
            },
            "ResultPath": "$.${scope}",
            "End": false,
            "Next": "${nextState}"
        }
    `

    let passConstruct = (stateName  :string,varName : string,varVal  :string,scope : string,nextState : string)=> `
    "${stateName}": {
        "Type": "Pass",
        "Result": {
        "${varName}" : ${varVal}
        },
        "ResultPath": "$.${scope}",
        "End": false,
        "Next": "${nextState}"
    }
`


    let taskConstruct = (stateName : string,taskResource : string, taskNext : string) => `
        "${stateName}": {
            "Type": "Task",
            "Resource": "$.main.${taskResource}",
            "InputPath": "$.main",
            "Next": "${taskNext}"
        }
        `
    let waitConstruct = (stateName : string,waitTime : string, waitNext : string) => `
        "${stateName}": {
            "Type": "Wait",
            "SecondsPath": "$.main.${waitTime}",
            "Next": "${waitNext}"
        }
    `

    let failConstruct = (stateName : string, failCause : string, failNext : string) => `
        "${stateName}": {
            "Type": "Fail"
        }
    `

    let succConstruct = (stateName : string, failCause : string, failNext : string) => `
    "${stateName}": {
        "Type": "Succeed"
    }
`


    // let stateTable = new Map<number, [string,string]>();
    // let stateArray : [string,(next : string)=> string][] = []
    // let prev = ""
    // let next = ""
    // for (let state of sortArr) {
    //     let id = v4()
    //     let stateString :  (next : string)=> string
    //     console.log(state.name);
    //     switch (state.name) {
    //         case "Integer":
    //             stateString = (next : string)=> passConstruct("State" +  id, "value" + id, state.attribute ?? "", "main", next);
    //             stateArray.push([id,stateString]);
    //             next = id
    //             break;
    //         case "String":
    //             stateString = (next : string)=> passStringConstruct("State" +  id, "value" + id, state.attribute ?? "", "main", next);
    //             stateArray.push([id,stateString]);
    //             next = id
    //             break;
    //         case "Boolean":
    //             stateString = (next : string)=> passConstruct("State" +  id, "value" + id, state.attribute ?? "", "main", next);
    //             stateArray.push([id,stateString]);
    //             next = id
    //             break;
    //         case "AVTask":
    //             prev = (stateArray[stateArray.length-2])[0]
    //             console.log(stateArray,"value"+ prev)
    //             stateString = (next : string)=> taskConstruct("State" +  id, "value" + prev, next);
    //             stateArray.push([id,stateString]);
    //             break;
    //         case "AWait":
    //             prev = (stateArray[stateArray.length-1])[0]
    //             console.log(stateArray)
    //             stateString = (next : string)=> waitConstruct("State" +  id, "value" + prev, next);
    //             stateArray.push([id,stateString]);
    //             break;
    //         case "AFail":
    //             stateString = (next : string)=> failConstruct("State" +  id, "", next);
    //             stateArray.push([id,stateString]);
    //             break;
    //         case "ASuccess":
    //             stateString = (next : string)=> succConstruct("State" +  id, "", next);
    //             stateArray.push([id,stateString]);
    //             break;
    //         default:
    //             break;
    //     }
    // }
    // console.log(stateArray);
    // let finalStateArray = []
    // console.log(stateArray.length)
    // for (let i = stateArray.length - 1; i > 0; i--) {
    //     console.log(i)
    //     console.log(stateArray[i-1][1]("State" + stateArray[i][0]))

    //     let statestr = stateArray[i-1][1]("State" + stateArray[i][0])
    //     finalStateArray.unshift(statestr)
    //     console.log(statestr);
    // }
    // finalStateArray.push(stateArray[stateArray.length - 1][1]("End"))
    // console.log(finalStateArray);


    
  }
  
  main();

