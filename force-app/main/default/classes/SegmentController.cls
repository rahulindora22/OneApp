public class SegmentController {
    
    public class DependentWrapper{
        @AuraEnabled
        public string key{get;set;}
        @AuraEnabled
        public LIst<pickValWrapper> pickValue{get;set;}
    }
    
    public class pickValWrapper {
        
        @AuraEnabled
        public string value{get;set;}
        @AuraEnabled
        public string label{get;set;}
    }
    
    @AuraEnabled
    public static String displayMasterComponent(Id userID){
        String userRole = system.label.OneApp_User_Type_Access;
        List<String> lstString = userRole.split(',');
        system.debug('---lstString--'+lstString);
        List<RMD_User_Role__c > tmList=[select id, RMD_Territory_Master__c, RMD_Territory_Master__r.Name,
                                        RMD_Territory_Master__r.RMD_Branch__c,RMD_Territory_Master__r.RMD_Branch__r.Name, RMD_Territory_Master__r.RMD_SAP_Unique_Code__c, RMD_Territory_Type__c
                                        from RMD_User_Role__c  where RMD_Territory_Type__c  ='DEPOT' AND RMD_User__c=:userID AND  RMD_Type__c In: lstString AND RMD_Active__c = true];
        system.debug('---tmList--'+tmList);
        if(tmList.size() > 0){
            return 'SUCCESS';
        }
        return 'Error';
    }
    
    @AuraEnabled
    public static List<Segment__c> displaySegmentsRWA(String searchkey){
        Id recordTypeId=Schema.SObjectType.Segment__c.getRecordTypeInfosByName().get('RWA').getRecordTypeId();
        List<Segment__c> returnlist=new List<Segment__c>();
        List<Segment__c> returnlist1=new List<Segment__c>();
        String searchword= '%'+searchkey+'%';
        system.debug('@@@@userInput@@@'+ searchword);
        if(!string.isBlank(searchkey) && searchkey.length()>2){
            list<Segment__c> segList=[select id, Name, RecordTypeId, Name_of_Society__c,Slab__c,Category__c, Address__c, City__c, Locality__r.Name,Pin_Code__c,Depot__c,Depot__r.Name   from Segment__c where (Name like:searchword or Pin_Code__c like:searchword or Name_of_Society__c like:searchword or Address__c  like:searchword  or Locality__r.Name like:searchword)and RecordTypeId =: RecordTypeId];
            System.debug('LINE number 9'+ segList);
            for(Segment__c seg:segList){
                System.debug('LINE number 11'+ seg);
                returnlist.add(seg);
            }
        }
        if(returnlist.size() > 0){
            return returnlist;
        }
        
        else{
            return returnlist1;
        }
    }
    
    @AuraEnabled
    public static List<pickValWrapper> getNeswpaperPicklist(Id recordId){
        Set<String> allProductName = new Set<String>();
        List<String> selectedNP = new List<String>();
        List<pickValWrapper> listPickValue =new list<pickValWrapper>();
        Id recordTypeId = Schema.SObjectType.Product2.getRecordTypeInfosByName().get('Reading Habit').getRecordTypeId();
        
        Segment__c seg = [Select Id,Depot__c,Depot__r.RMD_Branch__c,CreatedDate,Segment_Branch__c,Last_Check_In_Date__c from Segment__c Where Id =: recordId Limit 1];
        
        List<Product2> productList = [Select id, Name,RecordTypeId,Mandatory_For_RWA__c from Product2 where RMD_Branch__c =:seg.Segment_Branch__c 
                                      and RecordTypeId =: recordTypeId and Mandatory_For_RWA__c = false and isActive= true];
        system.debug('productList '+productList);
        
        List<Transactional_Details__c> txnList = [Select Id,Name From Transactional_Details__c Where Segment__c=: recordId]; 
        system.debug('txnList '+txnList);
        
        for(Transactional_Details__c txn : txnList){
            selectedNP.add(txn.Name);
        }
        system.debug('selectedNP '+selectedNP);
        
        for(Product2 pro : productList){
            if(!selectedNP.contains(pro.Name)){
                allProductName.add(pro.Name);
            }
        }
        
        system.debug('allProductName '+allProductName);
        
        
        for(string st : allProductName){
            system.debug('--st--'+st);
            pickValWrapper picvalueWrap = new pickValWrapper();
            picvalueWrap.label=st;
            picvalueWrap.value=st;
            listPickValue.add(picvalueWrap);
            system.debug('--listPickValue--'+listPickValue.size());
        }
        system.debug('--listPickValue--'+listPickValue);
        return listPickValue;
    }
    
    @AuraEnabled
    public static List<Transactional_Details__c> getTransDetails(Id segmentIdforTransDetail){
        List<Transactional_Details__c> transList = [Select Id,Name,Last_Visit__c,Second_Last_Visit__c,Ftd_count__c from Transactional_Details__c where Segment__c =:segmentIdforTransDetail order by CreatedDate ASC];
        system.debug('translist= '+transList);
        return transList;
    }
    
    @AuraEnabled
    public static void getTDetails(Id segId, String company, String newspaper, integer ftdcount){
        List<Transactional_Details__c> td1 = [select id,Name,Last_Visit__c,Second_Last_Visit__c,Visit_Date__c,FTD_Count__c
                                              from Transactional_Details__c where Segment__c=:segId 
                                              AND Name=:newspaper order by CreatedDate desc limit 2];
        
        system.debug('td1 = '+ td1);
        
        Transactional_Details__c tdrecord = new Transactional_Details__c();
        tdrecord.Last_Visit__c=ftdcount;
        tdrecord.Second_Last_Visit__c=0;
        tdrecord.Choose_Company__c=company;
        if(!(company == 'OTHERS')){
            tdrecord.Choose_Newspaper__c=newspaper;
        }
        if(td1.size()>0){
            system.debug('td1[0].FTD_Count__c = '+ td1[0].FTD_Count__c);
            
            tdrecord.Last_Visit__c=td1[0].FTD_Count__c;
            
        }
        if(td1.size()>1){
            system.debug('td1[1].FTD_Count__c = '+ td1[1].FTD_Count__c);
            
            tdrecord.Second_Last_Visit__c=td1[1].FTD_Count__c;
        }
        tdrecord.FTD_Count__c=ftdcount;
        tdrecord.Name=newspaper;
        tdrecord.Segment__c=segId;
        insert tdrecord;
    }
    
    @AuraEnabled
    public static List<Segment__c> displaySegmentsOOH(String searchkey){
        Id recordTypeId=Schema.SObjectType.Segment__c.getRecordTypeInfosByName().get('OOH').getRecordTypeId();
        List<Segment__c> returnlist=new List<Segment__c>();
        String searchword= '%'+searchkey+'%';
        system.debug('@@@@userInput@@@'+ searchword);
        if(!string.isBlank(searchkey) && searchkey.length()>2){
            list<Segment__c> segList=[select id, Name, RecordTypeId, Name_of_Society__c,Slab__c,Category__c, Address__c, City__c, Locality__r.Name  from Segment__c where (Name like:searchword or Name_of_Society__c like:searchword or Address__c  like:searchword or City__c like:searchword or Locality__r.Name like:searchword)and RecordTypeId =: RecordTypeId];
            System.debug('LINE number 9'+ segList);
            for(Segment__c seg:segList){
                System.debug('LINE number 11'+ seg);
                returnlist.add(seg);
            }
        }
        return returnlist;
    }
    
    @AuraEnabled
    public static List<Segment__c> displaySegmentsCSP(String searchkey,Integer pageSize, Integer pageNumber){
        Id recordTypeId=Schema.SObjectType.Segment__c.getRecordTypeInfosByName().get('CSP').getRecordTypeId();
        List<Segment__c> returnlist=new List<Segment__c>();
        String searchword= '%'+searchkey+'%';
        system.debug('@@@@userInput@@@'+ searchword);
        if(!string.isBlank(searchkey) && searchkey.length()>2){
            list<Segment__c> segList=[select id, Name, RecordTypeId, Name_of_Society__c,Slab__c,Category__c, Address__c, City__c, Locality__r.Name  from Segment__c where (Name like:searchword or Name_of_Society__c like:searchword or Address__c  like:searchword or City__c like:searchword or Locality__r.Name like:searchword)and RecordTypeId =: RecordTypeId];
            System.debug('LINE number 9'+ segList);
            for(Segment__c seg:segList){
                System.debug('LINE number 11'+ seg);
                returnlist.add(seg);
            }
        }
        return returnlist;
    }
    
    @AuraEnabled
    public static List<RMD_User_Role__c > displaySegmentsDEPO(String Id){
        String userRole = system.label.OneApp_User_Type_Access;
        List<String> lstString = userRole.split(',');
        system.debug('---lstString--'+lstString);
        List<RMD_User_Role__c > tmList=[select id, RMD_Territory_Master__c, RMD_Territory_Master__r.Name,
                                        RMD_Territory_Master__r.RMD_Branch__c,RMD_Territory_Master__r.RMD_Branch__r.Name, RMD_Territory_Master__r.RMD_SAP_Unique_Code__c, RMD_Territory_Type__c, RMD_User__c, RMD_User__r.Mobile_Id__c
                                        from RMD_User_Role__c  where RMD_Territory_Type__c  ='DEPOT' AND RMD_User__c=:Id AND  RMD_Type__c IN : lstString AND RMD_Active__c = true ];
        return tmList;
    }
    
    @AuraEnabled
    public static Id recordTypeRWA(){
        Id recordTypeId = Schema.SObjectType.Segment__c.getRecordTypeInfosByName().get('RWA').getRecordTypeId();
        
        return recordTypeId;
        
    }
    
    @AuraEnabled
    public static Id recordTypeSegmentContact(){
        Id recordTypeId = Schema.SObjectType.Segment_Contact__c.getRecordTypeInfosByName().get('Contact').getRecordTypeId();
        
        return recordTypeId;
        
    }
    
    @AuraEnabled
    public static Id recordTypeSegmentContactVendor(){
        Id recordTypeId = Schema.SObjectType.Segment_Contact__c.getRecordTypeInfosByName().get('Vendor').getRecordTypeId();
        system.debug('recordTypeId'+recordTypeId);
        return recordTypeId;
        
    }
    
    @AuraEnabled
    public static Id recordTypeOOH(){
        Id recordTypeId = Schema.SObjectType.Segment__c.getRecordTypeInfosByName().get('OOH').getRecordTypeId();
        
        return recordTypeId;
        
    }
    
    @AuraEnabled
    public static Id recordTypeCSP(){
        Id recordTypeId = Schema.SObjectType.Segment__c.getRecordTypeInfosByName().get('CSP').getRecordTypeId();
        
        return recordTypeId;
        
    }
    
    @AuraEnabled
    public static Id recordTypeDEPO(){
        Id recordTypeId = Schema.SObjectType.Segment__c.getRecordTypeInfosByName().get('DEPO').getRecordTypeId();
        
        return recordTypeId;
        
    }
    
    @AuraEnabled
    public static List <Segment_Contact__c> getSegmentContacts(String segmentIdforSegContacts) {
        //where Segment__c=:segmentIdforSegContacts
        Id recordTypeIdContact = Schema.SObjectType.Segment_Contact__c.getRecordTypeInfosByName().get('Contact').getRecordTypeId();
        List<Segment_Contact__c> contList = [ SELECT Id, Email__c, Name, Phone__c, Segment__c,Segments_Name__c, Segment__r.Name,Designation__c
                                             FROM Segment_Contact__c where Segment__c=:segmentIdforSegContacts AND recordTypeId=:recordTypeIdContact];
        
        system.debug('find id in apex = '+segmentIdforSegContacts);
        
        system.debug('find data in apex = '+contList);
        return contList;
    } 
    
    @AuraEnabled
    public static List <Segment_Contact__c> getSegmentContactVendor(String segmentIdforSegCntcts) {
        //where Segment__c=:segmentIdforSegContacts
        Id recordTypeIdVendor = Schema.SObjectType.Segment_Contact__c.getRecordTypeInfosByName().get('Vendor').getRecordTypeId();
        List<Segment_Contact__c> contLists = [ SELECT Id, Email__c, Name, Phone__c, Segment__c,Segments_Name__c, Segment__r.Name,Business_Partner__c,Business_Partner__r.Name
                                              FROM Segment_Contact__c where Segment__c=:segmentIdforSegCntcts AND recordTypeId=:recordTypeIdVendor];
        
        system.debug('find id in apex = '+segmentIdforSegCntcts);
        
        system.debug('find data in apex = '+contLists);
        return contLists;
    } 
    
    @AuraEnabled
    public static String saveSegmentContacts(String name, String email, String phone, String desigantion, String businessId, String segmentId, String isFromCall ){
        Id recordTypeIdContact = Schema.SObjectType.Segment_Contact__c.getRecordTypeInfosByName().get('Contact').getRecordTypeId();
        Id recordTypeIdVendor = Schema.SObjectType.Segment_Contact__c.getRecordTypeInfosByName().get('Vendor').getRecordTypeId();
        
        system.debug('name ---@@'+name);
        system.debug('email ---@@'+email);
        system.debug('phone ---@@'+phone);
        system.debug('desigantion ---@@'+desigantion);
        system.debug('segmentId ---@@'+segmentId);
        system.debug('businessId ---@@'+businessId);
        
        Segment_Contact__c sc = new Segment_Contact__c();
        RMD_Business_Partner__c rmdPartner = new RMD_Business_Partner__c();
        if(businessId != ''){
            rmdPartner = [Select id,RMD_First_Name__c, RMD_Last_Name__c,RMD_Email__c,RMD_Phone__c from RMD_Business_Partner__c where Id =: businessId];
            system.debug('--rmdPartner--'+rmdPartner);
            sc.RecordTypeId = recordTypeIdVendor;
            sc.Business_Partner__c = businessId;
            sc.Name = rmdPartner.RMD_First_Name__c+ ''+rmdPartner.RMD_Last_Name__c;
            sc.Email__c = rmdPartner.RMD_Email__c;
            sc.Phone__c = rmdPartner.RMD_Phone__c;
            sc.Segment__c = segmentId;
        }
        
        //  if( isFromCall == 'Contact' || rmdPartner == null){
        else{
            sc.RecordTypeId = recordTypeIdContact;
            sc.Designation__c = desigantion;
            sc.Name = name;
            sc.Email__c = email;
            sc.Phone__c = phone;
            sc.Segment__c = segmentId;
        }
        //else if( isFromCall == 'Vendor' || rmdPartner != null){
        
        //}
        
        insert sc;
        system.debug('SC ---@@'+sc);
        return 'Success';
        
    } 
    
    @AuraEnabled
    public static void saveTransDetail(List<Transactional_Details__c> tssList){
        // Id recordTypeIdContact = Schema.SObjectType.Segment_Contact__c.getRecordTypeInfosByName().get('Contact').getRecordTypeId();
        system.debug('accList'+tssList);
        Insert tssList;
        /*if(accList.size()>0 && accList != null){
insert accList;
}*/
    } 
    
    @AuraEnabled
    public static List<pickValWrapper> getTDPicklistValues(){
        List<pickValWrapper> abc = new List<pickValWrapper>();
        List<String> pickListValuesList= new List<String>();
        Schema.DescribeFieldResult fieldResult = Transactional_Details__c.Choose_Company__c.getDescribe();
        List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
        for( Schema.PicklistEntry pickListVal : ple){
            pickValWrapper def = new pickValWrapper();
            def.value=(pickListVal.getValue());
            def.label=(pickListVal.getLabel());
            // pickListValuesList.add(pickListVal.getLabel());
            if(def.label != 'Others' || def.label != 'Others'){
                abc.add(def); 
            }
            
        }    
        system.debug('abc'+abc);
        return abc;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Transactional_Details__c> getTypes(){ 
        List<Transactional_Details__c> l_Types = new List<Transactional_Details__c>();
        
        l_Types = [Select id, name, Choose_Newspaper__c from Transactional_Details__c]; // Can include multiple fields, 
        // You can also use any standard or custom object
        // You can get values from custom setting also.
        system.debug('picklist values = '+l_Types);
        return l_Types;
        
    }  
    
}