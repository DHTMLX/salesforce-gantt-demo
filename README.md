# Gantt demo for SalesForce

## How to start

- Change login url (sfdcLoginUrl) in sfdx-project.json to url of your SalesForce organization

- Create scratch org

```sh
sfdx force:auth:web:login -d
sfdx force:org:create -f project-scratch-def.json -s
```

- Publish code

```sh
sfdx force:source:push
sfdx force:data:tree:import -f ./data/GanttTask__c.json
```

- Open scratch org in browser

```
sfdx force:org:open
```

The scratch org already has Gantt app which you can check, or go to "Setup : Lighting Apps", create a new Lighting App and drop the Gantt from the list of available components.

## How to configure / modify

### Backend

getTasks in force-app/main/default/classes/GanttData.cls returns list of tasks and links, adjust this query as necessary. 

### Frontend

force-app/main/default/lwc/gantt/gantt.js contains code of web component

```js
function unwrap(fromSF){
    const data = fromSF.tasks.map(a => ({
```

**unwrap** functions controls how data from SalesForce is converted to Gantt compatible objects. You will need to modify this code if you will want to provide some additional data properties from SalesForce to the Gantt

```js
initializeUI(){
        const root = this.template.querySelector('.thegantt');
        root.style.height = this.height + "px";

        const gantt = window.Gantt.getGanttInstance();
```

**initializeUI** creates an instance of gantt. This is the perfect place to configure gantt by using its [API](https://docs.dhtmlx.com/gantt)


```js
gantt.createDataProcessor({ 
            task: {
```

**createDataProcessor** defines data saving rules, they need to be adjusted if you will want to save some extra fields along with the default Task's data. 

### Version of the Gantt


force-app/main/default/staticresources/dhtmlxgantt635.zip contains a trial version of the Gantt ( it will show a warning message time to time ). For production usage you will need to replace js and css files in this archive with ones from enterprise/ultimate Gantt package. 