public with sharing class EventRelayResponseParser {
  public class Errors {
  }

  public String id;
  public Boolean success;
  public List<Errors> errors;
  public List<Errors> warnings;
  public List<Errors> infos;

  public static EventRelayResponseParser parse(String json) {
    return (EventRelayResponseParser) System.JSON.deserialize(
      json,
      EventRelayResponseParser.class
    );
  }
}
