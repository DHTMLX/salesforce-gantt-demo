/* eslint-disable guard-for-in */
import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';

import { createRecord, updateRecord, deleteRecord } from 'lightning/uiRecordApi';

// Static resources
import GanttFiles from '@salesforce/resourceUrl/dhtmlxgantt713';

// Controllers
import getTasks from '@salesforce/apex/GanttData.getTasks';

function unwrap(fromSF){
    const data = fromSF.tasks.map(a => ({
        id: a.Id,
        text: a.Name,
        start_date: a.Start_Date__c,
        duration: a.Duration__c,
        parent: a.Parent__c,
        progress: a.Progress__c,
    }));
    const links = fromSF.links.map(a => ({
        id: a.Id,
        source: a.Source__c,
        target: a.Target__c,
        type: a.Type__c
    }));
    return { data, links };
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
            loadScript(this, GanttFiles + '/dhtmlxgantt.js'),
            loadStyle(this, GanttFiles + '/dhtmlxgantt.css'),
        ]).then(() => {
            this.initializeUI();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading Gantt',
                    message: error.message,
                    variant: 'error',
                }),
            );
        });
    }

    initializeUI(){
        const root = this.template.querySelector('.thegantt');
        root.style.height = this.height + "px";

        //uncomment the following line if you use the Enterprise or Ultimate version
        //const gantt = window.Gantt.getGanttInstance();
        gantt.templates.parse_date = date => new Date(date);
        gantt.templates.format_date = date => date.toISOString();
        gantt.init(root);
        getTasks().then(d => {
            gantt.parse(unwrap(d));
        })

        gantt.createDataProcessor({
            task: {
                create: function(data) {
                    const insert = { apiName: "GanttTask__c", fields:{
                        Name : data.text,
                        Start_Date__c : data.start_date,
                        Duration__c : data.duration,
                        Parent__c : String(data.parent),
                        Progress__c : data.progress
                    }};
                    return createRecord(insert).then(res => {
                        return { tid: 1, ...res };
                    });
                },
                update: function(data, id) {
                    const update = { fields:{
                        Id: id,
                        Name : data.text,
                        Start_Date__c : data.start_date,
                        Duration__c : data.duration,
                        Parent__c : String(data.parent),
                        Progress__c : data.progress
                    }};
                    return updateRecord(update).then(() => ({}));
                },
                delete: function(id) {
                    return deleteRecord(id).then(() => ({}));
                }
             },
             link: {
                create: function(data) {
                    const insert = { apiName: "GanttLink__c", fields:{
                        Source__c : data.source,
                        Target__c : data.target,
                        Type__c : data.type,
                    }};
                    return createRecord(insert).then(res => {
                        return { tid: res.id };
                    });
                },
                update: function(data, id) {
                    const update = { apiName: "GanttLink__c", fields:{
                        Id : id,
                        Source__c : data.source,
                        Target__c : data.target,
                        Type__c : data.type,
                    }};
                    return updateRecord(update).then(() => ({}));
                },
                delete: function(id) {
                    return deleteRecord(id).then(() => ({}));
                }
             }
        }).init(gantt);
    }
}
