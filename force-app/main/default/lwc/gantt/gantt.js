/* eslint-disable guard-for-in */
/* eslint-disable no-undef */
import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import { createRecord, updateRecord, deleteRecord } from "lightning/uiRecordApi";
 
// Static resources
import GanttFiles from "@salesforce/resourceUrl/dhtmlxgantt";
 
// Controllers
import getTasks from "@salesforce/apex/GanttData.getTasks";
 
function unwrap(fromSF) {
    const data = fromSF.tasks.map((a) => ({
        id: a.Id,
        text: a.Name,
        start_date: a.Start_Date__c,
        duration: a.Duration__c,
        parent: a.Parent__c,
        progress: a.Progress__c,
        type: a.Task_Type__c,
    }));
    const links = fromSF.links.map((a) => ({
        id: a.Id,
        source: a.Source__c,
        target: a.Target__c,
        type: a.Type__c
    }));
    return { data, links};
}
 
export default class GanttView extends LightningElement {
    static delegatesFocus = true;
 
    @api height;
    ganttInitialized = false;
 
    renderedCallback() {
        if (this.ganttInitialized) {
            return;
        }
        this.ganttInitialized = true;
 
        Promise.all([
            loadScript(this, GanttFiles + "/dhtmlxgantt.js"),
            loadStyle(this, GanttFiles + "/dhtmlxgantt.css")
        ])
            .then(() => {
                this.initializeUI();
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Error loading Gantt",
                        message: error.message,
                        variant: "error"
                    })
                );
            });
    }
 
    initializeUI() {
        const root = this.template.querySelector(".thegantt");
        root.style.height = this.height + "px";
 
        //uncomment the following line if you use the Enterprise or Ultimate version
        //const gantt = window.Gantt.getGanttInstance();

        // If your dates don't have hours, they will be converted to your timezone
        // To avoid that, use this construction: new Date(date + " 00:00:00")
        gantt.templates.parse_date = (date) => new Date(date);
        gantt.templates.format_date = (date) => date.toISOString();
 
        gantt.init(root);
        getTasks().then((d) => {
            const chartData = unwrap(d);
            gantt.parse({
                tasks: chartData.data,
                links: chartData.links
            });
        });
 
        ///↓↓↓ saving changes back to SF backend ↓↓↓
        gantt.createDataProcessor({
            task: {
                create: (data) => {
                    console.log("createTask",data);
                    const insert = {
                        apiName: "GanttTask__c",
                        fields: {
                            Name: data.text,
                            Start_Date__c: data.start_date,
                            Duration__c: data.duration,
                            Parent__c: String(data.parent),
                            Progress__c: data.progress
                        }
                    };
                    gantt.config.readonly = true; // suppress changes until saving is complete
                    return createRecord(insert).then((res) => {
                        gantt.config.readonly = false;
                        return { tid: res.id, ...res };
                    });
                },
                update: (data, id) => {
                    console.log("updateTask",data);
                    const update = {
                        fields: {
                            Id: id,
                            Name: data.text,
                            Start_Date__c: data.start_date,
                            Duration__c: data.duration,
                            Parent__c: String(data.parent),
                            Progress__c: data.progress
                        }
                    };
                    return updateRecord(update).then(() => ({}));
                },
                delete: (id) => {
                    return deleteRecord(id).then(() => ({}));
                }
            },
            link: {
                create: (data) => {
                    const insert = {
                        apiName: "GanttLink__c",
                        fields: {
                            Source__c: data.source,
                            Target__c: data.target,
                            Type__c: data.type
                        }
                    };
                    return createRecord(insert).then((res) => {
                        return { tid: res.id };
                    });
                },
                update: (data, id) => {
                    const update = {
                        apiName: "GanttLink__c",
                        fields: {
                            Id: id,
                            Source__c: data.source,
                            Target__c: data.target,
                            Type__c: data.type
                        }
                    };
                    return updateRecord(update).then(() => ({}));
                },
                delete: (id) => {
                    return deleteRecord(id).then(() => ({}));
                }
            }
        });
    }
}
