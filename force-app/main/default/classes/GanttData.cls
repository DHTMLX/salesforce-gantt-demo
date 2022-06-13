public with sharing class GanttData {
 
    @RemoteAction
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getTasks() {
       
        // fetching the Records via SOQL
        List<GanttTask__c> Tasks = new List<GanttTask__c>();
        Tasks = [SELECT Id, Name, Start_Date__c, Duration__c, Parent__c FROM GanttTask__c];
 
        List<GanttLink__c> Links = new List<GanttLink__c>();
        Links = [SELECT Id, Type__c, Source__c, Target__c FROM GanttLink__c];
 
        Map<String, Object> result = new Map<String, Object>{'tasks' => Tasks, 'links' => Links };
        return result;
   }
}