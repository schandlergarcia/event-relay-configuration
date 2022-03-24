global with sharing class EventRelayController {
  @AuraEnabled
  public static void createObject(String payload, String objectName) {
    EventRelayCallout.createObject(payload, objectName);
  }

  @AuraEnabled
  public static void updateConfigStatus(String payload, String recordId) {
    EventRelayCallout.updateConfigStatus(payload, recordId);
  }


  @AuraEnabled
  public static void getPlatformEventChannels(String payload) {
    EventRelayCallout.queryToolingApi(
      'SELECT Id,DeveloperName,ChannelType,MasterLabel FROM PlatformEventChannel',
      'PlatformEventChannel'
    );
  }

  @AuraEnabled
  public static void getPlatformEventChannelMembers(String payload) {
    EventRelayCallout.queryToolingApi(
      'SELECT Id,DeveloperName,EventChannel,MasterLabel, SelectedEntity FROM PlatformEventChannelMember',
      'PlatformEventChannelMember'
    );
  }

  @AuraEnabled
  public static void getEventRelayConfig(String payload) {
    EventRelayCallout.queryToolingApi(
      'SELECT Id,DeveloperName,MasterLabel,EventChannel,DestinationResourceName, State FROM EventRelayConfig',
      'EventRelayConfig'
    );
  }

  @AuraEnabled
  public static Datetime getCurrentDateTime() {
    return Datetime.now();
  }

  @AuraEnabled
  public static AsyncApexJob checkJobStatus(
    Datetime submittedDatetime,
    String methodName
  ) {
    List<AsyncApexJob> asyncApexJobs = [
      SELECT Id, Status, ExtendedStatus
      FROM AsyncApexJob
      WHERE MethodName = :methodName AND CompletedDate >= :submittedDatetime
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];
    AsyncApexJob asyncApexJob = (asyncApexJobs.size() == 1)
      ? asyncApexJobs.get(0)
      : null;

    if (asyncApexJob != null) {
      return asyncApexJob;
    }

    return null;
  }

  @AuraEnabled
  public static List<NamedCredential> getNamedCredentials() {
    List<NamedCredential> namedCredentials = [
      SELECT Id, DeveloperName, Endpoint, MasterLabel, PrincipalType
      FROM NamedCredential
      WITH SECURITY_ENFORCED
    ];

    return namedCredentials;
  }

  @AuraEnabled
  public static List<String> getEventDefinitions() {
    List<String> eventList = new List<String>();
    for (Schema.SObjectType objTyp : Schema.getGlobalDescribe().Values()) {
      Schema.DescribeSObjectResult describeSObjectResultObj = objTyp.getDescribe();
      String name = objTyp.getDescribe().getName();
      if (
        name.containsignorecase('__e') || name.containsignorecase('ChangeEvent')
      ) {
        eventList.add(name);
      }
    }
    return eventList;
  }
}
