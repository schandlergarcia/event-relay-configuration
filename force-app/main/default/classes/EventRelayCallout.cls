public with sharing class EventRelayCallout {
  public class EventRelayCalloutException extends Exception {
  }

  private static String baseUrl = URL.getSalesforceBaseUrl().toExternalForm();

  public class SessionId {
    public string sessionId;
  }

  //Get the session ID from the APEX Page
  @AuraEnabled
  public static string getUserSessionId() {
    SessionId sessionJson = new SessionId();
    if (!Test.isRunningTest()) {
      sessionJson = (SessionId) JSON.deserialize(
        Page.EventRelaySession.getContent().toString(),
        SessionId.class
      );
    }
    return sessionJson.sessionId;
  }

  @Future(callout=true)
  public static void createObject(String payload, String objectName) {
    system.debug('Payload:' + payload);
    //Set up the authorization header for the API request
    String sessionId = getUserSessionId();
    String authorizationHeader = 'Bearer ' + sessionId;

    String namedCredintialEndpoint =
      baseUrl +
      '/services/data/v54.0/tooling/sobjects/' +
      objectName +
      '/';
    system.debug('endpoint: ' + namedCredintialEndpoint);
    //Set up the HTTP Classes
    Http http = new Http();
    HttpRequest req = new HttpRequest();
    HttpResponse res = new HttpResponse();

    //Create the HTTPS Request Parameters
    req.setEndpoint(namedCredintialEndpoint);
    req.setMethod('POST');
    req.setHeader('Authorization', authorizationHeader);
    req.setHeader('Authorization', 'Bearer ' + sessionId);
    req.setHeader('Content-Type', 'application/json');
    req.setBody(payload);
    //Submit the request
    try {
      res = http.send(req);
      String response = res.getBody();
      if (res.getStatusCode() != 201) {
        throw new EventRelayCalloutException(
          res.getStatus() +
          ': ' +
          res.getBody()
        );
      }
      EventRelayResponseParser parsedResponse = EventRelayResponseParser.parse(
        response
      );
    } catch (System.CalloutException e) {
      System.debug('Callout Error' + e);
    }
  }

  @Future(callout=true)
  public static void queryToolingApi(String query, String objectName) {
    //Set up the authorization header for the API request
    String sessionId = getUserSessionId();
    String authorizationHeader = 'Bearer ' + sessionId;

    String queryEndpoint =
      baseUrl +
      '/services/data/v54.0/tooling/query?q=' +
      query;
    system.debug('endpoint: ' + queryEndpoint);
    //Set up the HTTP Classes
    Http http = new Http();
    HttpRequest req = new HttpRequest();
    HttpResponse res = new HttpResponse();

    //Create the HTTPS Request Parameters
    queryEndpoint = queryEndpoint.replace(' ', '+');
    req.setEndpoint(queryEndpoint);
    req.setMethod('GET');
    req.setHeader('Authorization', authorizationHeader);
    req.setHeader('Authorization', 'Bearer ' + sessionId);
    req.setHeader('Content-Type', 'application/json');
    //Submit the request
    try {
      res = http.send(req);
      String response = res.getBody();
      if (res.getStatusCode() != 200) {
        throw new EventRelayCalloutException(
          res.getStatus() +
          ': ' +
          res.getBody()
        );
      }
      system.debug('Response: ' + response);
      notifyUserInterface(response, objectName);
    } catch (System.CalloutException e) {
      System.debug('Callout Error' + e);
    }
  }

  @Future(callout=true)
  public static void updateConfigStatus(String payload, String recordId) {
    system.debug('Payload:' + payload);
    //Set up the authorization header for the API request
    String sessionId = getUserSessionId();
    String authorizationHeader = 'Bearer ' + sessionId;

    String namedCredintialEndpoint =
      baseUrl +
      '/services/data/v54.0/tooling/sobjects/EventRelayConfig/'+ recordId;
    system.debug('endpoint: ' + namedCredintialEndpoint);
    //Set up the HTTP Classes
    Http http = new Http();
    HttpRequest req = new HttpRequest();
    HttpResponse res = new HttpResponse();

    //Create the HTTPS Request Parameters
    req.setEndpoint(namedCredintialEndpoint);
    req.setMethod('PATCH');
    req.setHeader('Authorization', authorizationHeader);
    req.setHeader('Authorization', 'Bearer ' + sessionId);
    req.setHeader('Content-Type', 'application/json');
    req.setBody(payload);
    //Submit the request
    try {
      res = http.send(req); 
      String response = res.getBody();
      if (res.getStatusCode() != 204) {
        throw new EventRelayCalloutException(
          res.getStatus() +
          ': ' +
          res.getBody()
        );
      }
    } catch (System.CalloutException e) {
      System.debug('Callout Error' + e);
    }
  }

  public static void notifyUserInterface(String response, String objectName) {
    EventRelaySetup__e newEvent = new EventRelaySetup__e();
    newEvent.ObjectName__c = objectName;
    newEvent.Payload__c = response;
    EventBus.publish(newEvent);
  }
}
