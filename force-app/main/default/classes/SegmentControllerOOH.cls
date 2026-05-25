public class SegmentControllerOOH {

    @AuraEnabled 
    public static void checkInFromOneApp(Decimal lat, Decimal lng,Id recordId,String recordTypeCheckin) {
        system.debug('lat '+lat+ ' lng '+lng + 'recordId '+recordId+' recordTypeCheckin '+recordTypeCheckin);
        Check_In__c ci = new Check_In__c();
        if(recordTypeCheckin !=null){
            system.debug('recordTypeCheckin 19 =  '+recordTypeCheckin);
           // ci.Name = recordTypeCheckin;
        }
        else{
            RMD_Territory_Master__c tmc = [Select id, name, Depo_Geolocation__c from RMD_Territory_Master__c where id=:recordId];
            if(tmc.Depo_Geolocation__c!=null){
                Location locZip = Location.newInstance(lat, lng);
                Double dist = Location.getDistance(locZip,tmc.Depo_Geolocation__c,'km');
                Double dist2 = locZip.getDistance(tmc.Depo_Geolocation__c, 'km');
                system.debug('dist2'+dist2);
                dist= dist*1000;
                if(dist<=200){
                    
                   // ci.Name = 'DEPOT';
                }
                else{
                    
                }
                // metre
                system.debug('dist'+dist); 
            }
            else{
                
                ci.Territory_Master__c=recordId;
               // ci.Name = 'DEPOT';
                system.debug('recordTypeCheckin 25 =  '+recordTypeCheckin);
            }
            
            
        }       
        ci.Check_In_Location__Latitude__s = lat;
        ci.Check_In_Location__Longitude__s = lng;
        
        if(ci != null){
            insert ci;    
        }
        if(recordTypeCheckin !=null){
            system.debug('recordTypeCheckin 34 =  '+recordTypeCheckin);
            
            Segment__c seg = [Select Id,Pending_For_Approval__c,Approved_Geolocation__c from Segment__c Where Id =: recordId Limit 1];
            system.debug('Segment '+seg);
            seg.Pending_For_Approval__Latitude__s = lat;
            seg.Pending_For_Approval__Longitude__s = lng;
            seg.Pending_For_Approval1__Latitude__s = lat;
            seg.Pending_For_Approval1__Longitude__s = lng;
            
            if(seg != null ){
                update seg;    
            }
            
        }
        
    }
    
    @AuraEnabled
    public static string checkInSecondTime(Decimal lat, Decimal lng,Id recordId,String recordTypeCheckin) {
        system.debug('lat '+lat+ ' lng '+lng + 'recordId '+recordId+' recordTypeCheckin '+recordTypeCheckin);
        string str;
        Check_In__c ci = new Check_In__c();
       // ci.Name = recordTypeCheckin;
        ci.Check_In_Location__Latitude__s = lat;
        ci.Check_In_Location__Longitude__s = lng;
        
        if(ci != null){
            insert ci;    
        }
        
        Segment__c seg = [Select Id,Pending_For_Approval__c,Approved_Geolocation__c from Segment__c Where Id =: recordId Limit 1];
        
        Boolean flag = False;
        If(seg.Approved_Geolocation__c != null){
            Location locZip = Location.newInstance(lat, lng);
            Double dist = Location.getDistance(locZip,seg.Approved_Geolocation__c,'km');
            Double dist2 = locZip.getDistance(seg.Approved_Geolocation__c, 'km');
            system.debug('dist2'+dist2);
            // Use lable 
            dist= dist*1000;
            if(dist<=200){
                flag = true;
            }
            // metre
            system.debug('dist'+dist);    
        }
        else{
            seg.Pending_For_Approval__Latitude__s = lat;
            seg.Pending_For_Approval__Longitude__s = lng;
            seg.Pending_For_Approval1__Latitude__s = lat;
            seg.Pending_For_Approval1__Longitude__s = lng;  
            flag = true;
            update seg;
        }
        
        if(flag){
            str = 'success';
        }
        return str;
    }
    
    @AuraEnabled
    public static string addedNonMandotryNewsPaper(Decimal lat, Decimal lng,Id recordId,String recordTypeCheckin, List<selectedDataWrap> stList ) {
        system.debug('lat '+lat+ ' lng '+lng + 'recordId '+recordId+' recordTypeCheckin '+recordTypeCheckin +'stList--'+stList);
        string str;
        Check_In__c ci = new Check_In__c();
      //  ci.Name = recordTypeCheckin;
        ci.Check_In_Location__Latitude__s = lat;
        ci.Check_In_Location__Longitude__s = lng;
        
        if(ci != null){
            insert ci;    
        }
        
        Segment__c seg = [Select Id,Pending_For_Approval__c,Approved_Geolocation__c from Segment__c Where Id =: recordId Limit 1];
        
        Boolean flag = False;
        If(seg.Approved_Geolocation__c != null){
            Location locZip = Location.newInstance(lat, lng);
            Double dist = Location.getDistance(locZip,seg.Approved_Geolocation__c,'km');
            Double dist2 = locZip.getDistance(seg.Approved_Geolocation__c, 'km');
            system.debug('dist2'+dist2);
            dist= dist*1000;
            if(dist<=200){
                flag = true;
            }
            // metre
            system.debug('dist'+dist);    
        }
        else{
            seg.Pending_For_Approval__Latitude__s = lat;
            seg.Pending_For_Approval__Longitude__s = lng;
            seg.Pending_For_Approval1__Latitude__s = lat;
            seg.Pending_For_Approval1__Longitude__s = lng;  
            flag = true;
            update seg;
        }
        List<Transactional_Details__c> txnList = [Select Id,Name From Transactional_Details__c Where Segment__c=: recordId]; 
        system.debug('txnList '+txnList); 
        
        List<Transactional_Details__c> newTxnList = new List<Transactional_Details__c>();
        for(selectedDataWrap sdl : stList){
            Transactional_Details__c tdrecord = new Transactional_Details__c();
            tdrecord.FTD_Count__c= Decimal.valueof(sdl.FTDCount);
            tdrecord.Name=sdl.newsPaper;  
            tdrecord.Segment__c=sdl.sId;  
            newTxnList.add(tdrecord);
        }
        system.debug('--insert newTxnList----@@'+newTxnList);
        if(newTxnList.size() >0){
            insert newTxnList;
            flag = true;
        }
        
        
        
        if(flag){
            str = 'success';
        }
        return str;
    }
    
    //fetching segment depo branch and creatingTransaction record 
    @AuraEnabled
    public static List<Transactional_Details__c> insertTransactionDetails(Id recordId) {
        
        List<Transactional_Details__c> tdList = new  List<Transactional_Details__c>();
        List<Transactional_Details__c> tdl = [Select Id,Name,Last_Visit__c,Second_Last_Visit__c,Segment__c,FTD_Count__c From Transactional_Details__c where Id In:tdList];
        system.debug('tdlList '+tdl); 
        return  tdl; 
    }
    
    //recalling data after Handle Save Button In Create Transactional details
    @AuraEnabled
    public static List<Transactional_Details__c> viewTransactionDetails(Id recordId) {
        Segment__c seg = [Select Id,Depot__c,CreatedDate from Segment__c Where Id =: recordId Limit 1];
        List<Transactional_Details__c> tdl = [Select Id,Name,Last_Visit__c,Second_Last_Visit__c,Segment__c,FTD_Count__c From Transactional_Details__c where Segment__c =:seg.Id];
        return tdl;
    }
    
    //View data after Searching Name From Search Button
    @AuraEnabled
    public static dataList viewTransactionDetailsSecondTime(Id recordId) {
        //dataList dtList = new dataList();
        //dataList dts = new dataList();
        map<String,dataTable> mapOfName = new map<String,dataTable>();
        map<Id,dataTable> mapOfName1 = new map<Id,dataTable>();
        Set<String> selectedNP = new Set<String>();
        Set<String> selectedPaper = new Set<String>();
        List<dataTable> dtsList = new List<dataTable>();
        dataheader dh = new dataHeader();
        Set<String> stSet = new Set<String>();

        Id recordTypeId = Schema.SObjectType.Product2.getRecordTypeInfosByName().get('Reading Habit').getRecordTypeId();
        
        Segment__c seg = [Select Id,Depot__c,CreatedDate,Segment_Branch__c,Last_Check_In_Date__c from Segment__c Where Id =: recordId Limit 1];
        
        List<Product2> productList = [Select id, Name,RecordTypeId from Product2 where RMD_Branch__c =:seg.Segment_Branch__c 
                                      and RecordTypeId =: recordTypeId and Mandatory_For_OOH__c= true and isActive= true];
        system.debug('---productList--'+productList);
        
        for(Product2 pro : productList){
            selectedNP.add(pro.Name);
        }
        system.debug('--selectedNP---@@='+selectedNP);
        
       
        List<Transactional_Details__c> txnDetailsList = [Select Id,Name,Last_Visit__c,FTD_Covid_Count__c,Second_Last_Visit_Date__c,Second_Last_Visit__c,Segment__c,Is_Pre_Covid_Count__c,
                                                             FTD_Count__c,Visit_Date__c,CheckInDate__c From Transactional_Details__c 
                                                             where Segment__c =:seg.Id order by CreatedDate ASC ];
        
        system.debug('--txnDetailsList--111-@@='+txnDetailsList);
        List<Transactional_Details__c> txnDetailsListPreCovid = [Select Id,Name,Last_Visit__c,FTD_Covid_Count__c,Second_Last_Visit_Date__c,Second_Last_Visit__c,Segment__c,Is_Pre_Covid_Count__c,
                                                             FTD_Count__c,Visit_Date__c,CheckInDate__c From Transactional_Details__c 
                                                             where Segment__c =:seg.Id and Is_Pre_Covid_Count__c = true ];
        system.debug('--txnDetailsListPreCovid--222-@@='+txnDetailsListPreCovid);
        
        Map<String, Decimal > mapofPrecovid = new Map<String, Decimal>();
        for(Transactional_Details__c txn : txnDetailsListPreCovid){
            mapofPrecovid.put(txn.Name, txn.FTD_Covid_Count__c);
        }
        system.debug('--mapofPrecovid-'+mapofPrecovid);
        system.debug('txnDetailsList = '+txnDetailsList.size());
         system.debug('txnDetailsListPreCovid = '+txnDetailsListPreCovid.size());
        system.debug('txnDetailsListPreCovid = '+txnDetailsListPreCovid);
        for(Transactional_Details__c sv : txnDetailsList){
            selectedNP.remove(sv.Name);
        }
        system.debug('--selectedNP--252-@@='+selectedNP);
        system.debug('--seg.Last_Check_In_Date__c--253--'+seg.Last_Check_In_Date__c);
        for(String s : selectedNP){
            dataTable dt = new dataTable();
            dt.name = s;
            dt.secondlastdate = 0;
            dt.lastdate = 0;
           // dt.ftdcount = 0;
            dt.count = 0;
            mapOfName.put(s,dt);
        }
        system.debug('--mapOfName-280-'+mapOfName);
        if(seg.Last_Check_In_Date__c == null){
            if(txnDetailsList.size() == 0){
                for(String s : selectedNP){
                    dataTable dt = new dataTable();
                    dt.name = s;
                    dt.secondlastdate = 0;
                    dt.lastdate = 0;
                    //dt.ftdcount = 0;
                    dt.count = 0;
                    mapOfName.put(s,dt);
                }
            }
            else if(txnDetailsList.size() > 0){
                system.debug('---txnDetailsList--@'+txnDetailsList);
                for(Transactional_Details__c td : txnDetailsList){
                    if( td.Is_Pre_Covid_Count__c == true  ){
                        system.debug('---td.Is_Pre_Covid_Count__c--@'+td.Is_Pre_Covid_Count__c);
                        dataTable dt = new dataTable();
                        dt.name = td.Name;
                        dt.secondlastdate = td.Second_Last_Visit__c;
                        dt.lastdate = td.Last_Visit__c;
                        //dt.ftdcount = 0;
                        if(td.FTD_Covid_Count__c > 0){
                             dt.count = td.FTD_Covid_Count__c;
                        }
                        else{
                            
                        }
                       
                        dh.covidCheck = true;
                        stSet.add(td.Name);
                        mapOfName.put(td.Name,dt); 
                        
                    }
                }
            }
            system.debug('---mapOfName--@'+mapOfName);
        }
        else if(seg.Last_Check_In_Date__c != null){
            for(Transactional_Details__c td : txnDetailsList){
                 //dataTable dt = new dataTable();
                 
                  if(td.Is_Pre_Covid_Count__c == true){
                   Decimal dc =  mapofPrecovid.get(td.Name);
                   system.debug('--dec--@@'+dc);
                   /* dataTable dt1 = mapOfName.get(td.Name);
                      if(dt1 != null){
                          dt1.name = td.Name;
                          dt1.secondlastdate = td.Second_Last_Visit__c;
                          dt1.count = td.FTD_Covid_Count__c;
                          dh.covidCheck = true;
                          mapOfName1.put(td.Id,dt1);
                      }
                      else{*/
                          dataTable dt = new dataTable();
                          dt.name = td.Name;
                          dt.secondlastdate = td.Second_Last_Visit__c;
                          dt.count = dc;
                          dh.covidCheck = true;
                          stSet.add(td.Name);
                          mapOfName.put(td.Name,dt);
                          mapOfName1.put(td.Id,dt);
                     // }
                    
                     
                }
               // if ( td.Is_Pre_Covid_Count__c == false  ){
                else if ( td.Is_Pre_Covid_Count__c == false  ){
                    Decimal dc =  mapofPrecovid.get(td.Name);
                    dataTable dt = new dataTable();
                    dt.name = td.Name;
                    dt.secondlastdate = td.Second_Last_Visit__c;
                    dt.lastdate = td.Last_Visit__c;
                    //dt.ftdcount = 0;
                    dt.count = dc;
                    stSet.add(td.Name);
                    mapOfName.put(td.Name,dt); 
                    dh.covidCheck = true;
                   // dh.covidCheck = false;
                    mapOfName1.put(td.Id,dt);
                }
               
               
            }
             system.debug('--mapOfName-365-'+mapOfName);
            dh.lastVisit = String.valueOf(seg.Last_Check_In_Date__c);
            dh.visitDate = seg.Last_Check_In_Date__c;
        }
        
         for(String s: mapOfname.keyset()){
            system.debug('--s--'+s);
            dataTable dt = mapOfName.get(s);
            dtsList.add(dt);
        }
        dataList dts = new dataList();
        dts.dataTable= dtsList;
        dts.dataHeader = dh;
        return  dts;
    }
    
    @AuraEnabled
    public static dataHeader txnVisitSave(Id segmentId, List<dataTable> selectedRow ) {
        
        system.debug('--segmentId-@--'+segmentId);
        system.debug('--selectedRow-@--'+selectedRow);
        Set<String> stList = new Set<String>();
        dataHeader dts = new dataHeader();
        
        Segment__c seg = [Select Id,Depot__c,CreatedDate,Last_Check_In_Date__c from Segment__c Where Id =: segmentId Limit 1];  
        List<Transactional_Details__c> tdList = new  List<Transactional_Details__c>();
        List<Transactional_Details__c> txnDtlList = new  List<Transactional_Details__c>();
        Set<String> stSetFirst = new Set<String>();
        Set<String> stSetSecond = new Set<String>();
        if(seg.Id != null){
            Boolean ftdCount= false;
            
            for(dataTable st : selectedRow){
                stList.add(st.name);
                if(ftdCount == false){
                    ftdCount = true;
                }
            }
            
            system.debug('--stList--'+stList);
            List<Transactional_Details__c> txnDatailSList = [select id,Name,Last_Visit__c,Second_Last_Visit__c,Visit_Date__c,FTD_Count__c,CheckInDate__c
                                              from Transactional_Details__c where Segment__c=:segmentId 
                                               AND Name IN:stList order by CreatedDate desc];
            
            system.debug('--txnDatailSList--'+txnDatailSList);
            for(Transactional_Details__c ts : txnDatailSList){
                if(!stSetFirst.contains(ts.Name)){
                    stSetFirst.add(ts.Name);
                    txnDtlList.add(ts);
                }
                else if(!stSetSecond.contains(ts.Name)){
                     stSetSecond.add(ts.Name);
                    // txnDtlList.add(ts);
                }
                
            }
            system.debug('txnDtlList--@@'+txnDtlList);
            Map<String, Transactional_Details__c> tdsMap = new Map<String, Transactional_Details__c>();
            for(Transactional_Details__c ts : txnDtlList){
                tdsMap.put(ts.Name, ts);
            }
            system.debug('tdsMap--@@'+tdsMap);
           
            for(dataTable st : selectedRow){
                Transactional_Details__c td = new Transactional_Details__c();
                if(txnDtlList.size() > 0 ){
                    if(ftdCount == true ){
                    td.name = st.name;
                    td.Segment__c = seg.Id;
                    td.FTD_Count__c = st.ftdcount;
                    DateTime dT = system.today();
                    Date myDate = date.newinstance(dT.year(), dT.month(), dT.day());
                    td.CheckInDate__c = myDate;
                    td.Last_Visit__c = td.FTD_Count__c;
                    if(txnDtlList.size() > 0 ){
                 
                    }
                    
                    tdList.add(td);
                    
                    }
                }
                else{
                    system.debug('st.name '+st.name);
                    system.debug('st.ftdcount '+st.ftdcount);
                   // if(st.ftdcount > 0){
                        td.name = st.name;
                        td.Segment__c = seg.Id;
                        td.FTD_Count__c = st.ftdcount;
                        DateTime dT = system.today();
                        Date myDate = date.newinstance(dT.year(), dT.month(), dT.day());
                        td.CheckInDate__c = myDate;
                        td.Last_Visit__c = st.ftdcount;
                        tdList.add(td);
                    //}
                   
                }
               
            }
            system.debug('tdList264 '+tdList);
            insert tdList;
            seg.Last_Check_In_Date__c = system.today();
            update seg;
            
            
        }
        return dts;
    }
    /*@AuraEnabled
public static List<Transactional_Details__c> viewAgainTransactionDetailsSecondTime(Id recordId) {
Segment__c seg = [Select Id,Depot__c,CreatedDate from Segment__c Where Id =: recordId Limit 1];
List<Transactional_Details__c> tdl = [Select Id,Name,Last_Visit__c,Second_Last_Visit__c,Segment__c,FTD_Count__c From Transactional_Details__c where Segment__c =:seg.Id];
return tdl;
}*/
    
    /* @AuraEnabled
public static List<Transactional_Details__c> viewTransactionDetailsSecondTime(Id recordId) {
Segment__c seg = [Select Id,Depot__c,CreatedDate from Segment__c Where Id =: recordId Limit 1];  
List<Transactional_Details__c> tdl = [Select Id,Name,Last_Visit__c,Second_Last_Visit__c,Segment__c,FTD_Count__c From Transactional_Details__c where Segment__c =:seg.Id];
return tdl;
} */
    
    public class dataList{
        @AuraEnabled public List<dataTable> dataTable  {get;set;}	
        @AuraEnabled public dataHeader dataHeader {get;set;}
    }
    
    public class dataHeader{
        @AuraEnabled  public Date visitDate  {get;set;}	   
        @AuraEnabled  public String lastVisit  {get;set;}
        @AuraEnabled  public String secondLastVisit  {get;set;}
        @AuraEnabled  public Boolean covidCheck  {get;set;}
        
    }
     public class selectedDataWrap{
        @AuraEnabled  public Id sId  {get;set;}	   
        @AuraEnabled  public String  FTDCount {get;set;}
        @AuraEnabled  public String newsPaper  {get;set;}
       
        
    }
    
    public class dataTable {
        @AuraEnabled  public String name  {get;set;}
        @AuraEnabled  public Decimal secondlastdate  {get;set;}
        @AuraEnabled  public Decimal preCovidCount  {get;set;}
        @AuraEnabled  public Decimal lastdate {get;set;}
        @AuraEnabled  public Decimal ftdcount {get;set;}
        @AuraEnabled  public Decimal count {get;set;}
    }
}