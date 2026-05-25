public class GeolocationController {
   
   
    @AuraEnabled 
    public static String erroLogCreate(Id recordId, Id userIds, String mobId,String deviceNM) {
        User u = [Select id,Name,Email,Mobile_Id__c from User where Id =: userIds];
        list<RMDErrorLogUtilityHelper.ErrorLogWrapper> listErrorLogWrapper = new list<RMDErrorLogUtilityHelper.ErrorLogWrapper>();
        RMDErrorLogUtilityHelper.ErrorLogWrapper objErrorLogWrapper = new RMDErrorLogUtilityHelper.ErrorLogWrapper();
        objErrorLogWrapper.functionName = 'Check IN';
        objErrorLogWrapper.referenceID = userIds;  
        objErrorLogWrapper.message = 'Device Id Not Found';
        objErrorLogWrapper.objectName = 'Device Not Register';  
        objErrorLogWrapper.errorOperation = 'Device Not Register';
        objErrorLogWrapper.messageDescription =  'Depot Id - '+recordId+' '+'Mobile Id - '+mobId +' '+'Device Log In - '+deviceNM;
        objErrorLogWrapper.ex = null;
        listErrorLogWrapper.add(objErrorLogWrapper);
        system.debug('--listErrorLogWrapper--'+listErrorLogWrapper);
        RMDErrorLogUtilityHelper.logError(listErrorLogWrapper);
        return 'Success';
    }
    
    @AuraEnabled 
    public static Boolean validateDepoCheckInToday(Id recordIdDepo){
        Boolean StatusOfCheckIn = false;
        Id userIds = UserInfo.getUserId();
        system.debug('==userIds==@@=='+userIds);
        system.debug('==recordIdDepo==@@=='+recordIdDepo);
        List<Check_In__c> checkInList = [Select id,Check_In_Count__c,Check_Out__c,Check_Out_Time__c from  Check_In__c where Territory_Master__c =: recordIdDepo and createdById =: userIds and CreatedDate = Today and Check_Out__Latitude__s = null and Check_Out__Longitude__s = null and Check_Out_Time__c = null order By CreatedDate Desc limit 1];
        system.debug('--checkInList--'+checkInList);
        system.debug('--checkInList-size-'+checkInList.size());
        if(checkInList.size() > 0){
            StatusOfCheckIn = false;
        }
        else{
            StatusOfCheckIn = true;
        }
        
        return StatusOfCheckIn;
    }
    
    @AuraEnabled 
    public static Boolean validateCheckInToday(Id recordIdDepo){
        Boolean StatusOfCheckIn = false;
        Id userIds = UserInfo.getUserId();
        system.debug('==userIds==@@=='+userIds);
        system.debug('==recordIdDepo==@@=='+recordIdDepo);
        List<Check_In__c> checkInList = [Select id from Check_In__c where Segment__c =: recordIdDepo and createdById =: userIds and CreatedDate = Today and Check_Out__Longitude__s = null and Check_Out__Latitude__s = null and Check_Out_Time__c = null order By CreatedDate Desc limit 1];
        system.debug('--checkInList--'+checkInList);
        system.debug('--checkInList-size-'+checkInList.size());
        if(checkInList.size() > 0){
            StatusOfCheckIn = false;
        }
        else{
            StatusOfCheckIn = true;
        }
        system.debug('--StatusOfCheckIn-RWA-'+StatusOfCheckIn);
        return StatusOfCheckIn;
    }
    @AuraEnabled
    public static String checkOutFromOneAppDepot(Decimal lat, Decimal lng,Id recordId,String recordTypeCheckin, Id userIds, String mobId,String deviceNM) {
        system.debug('==mobId==@@=='+mobId);
        system.debug('lat '+lat+ ' lng '+lng + 'recordId '+recordId+' recordTypeCheckin '+recordTypeCheckin);
        User u = [Select id,Mobile_Id__c from User where Id =: userIds];
        system.debug('==u==@@=='+u);
        
        try{
            Check_In__c ci = new Check_In__c();
            
            Boolean checkNetiveId = false;
            RMD_Territory_Master__c tmc = [Select id, name, Depo_Geolocation__c from RMD_Territory_Master__c where id=:recordId];
            system.debug('--tmc--'+tmc);
            List<Check_In__c> checkInList = [Select id,Check_In_Count__c,Check_Out__c,Check_Out_Time__c from  Check_In__c where Territory_Master__c =: recordId and createdById =: userIds and CreatedDate = Today and Check_Out__Latitude__s = null and Check_Out__Longitude__s = null and Check_Out_Time__c = null order By CreatedDate Desc limit 1];
            system.debug('--checkInList--'+checkInList);
            system.debug('--checkInList-size-'+checkInList.size());
             List<Check_In__c> checkInListUpdate = new  List<Check_In__c>();
            //if(checkInList.size() > 0){
            for(Check_In__c co : checkInList){
                 system.debug('--co--'+co);
                Location locZip = Location.newInstance(lat, lng);
                Double dist = Location.getDistance(locZip,tmc.Depo_Geolocation__c,'km');
                Double dist2 = locZip.getDistance(tmc.Depo_Geolocation__c, 'km');
                system.debug('dist2'+dist2);
                String checkInAllowed = System.label.Check_In_Allowed_Range;
                system.debug('checkInAllowed'+checkInAllowed);
                dist= dist*1000;
                system.debug('dist'+dist);
                if(dist<=Integer.valueOf(checkInAllowed)){
                    co.Distance_Between_Depot_And_Check_In__c = dist;
                    co.Check_Out__Latitude__s = lat;
                    co.Check_Out__Longitude__s = lng;
                    co.Check_Out_Time__c = system.now();
                    checkInListUpdate.add(co);
                     system.debug('@--checkInListUpdate--@@'+checkInListUpdate);
            }
                else{
                    return 'Check Out Fail';
                } 
          }
           system.debug('@--checkInListUpdate--@@'+checkInListUpdate);
            update checkInListUpdate;
            return 'Check Out Success';
        /*  }
            else{
                 return 'Check Out Fail';
            } */
        }
        catch(exception ex){
            list<RMDErrorLogUtilityHelper.ErrorLogWrapper> listErrorLogWrapper = new list<RMDErrorLogUtilityHelper.ErrorLogWrapper>();
            RMDErrorLogUtilityHelper.ErrorLogWrapper objErrorLogWrapper = new RMDErrorLogUtilityHelper.ErrorLogWrapper();
            objErrorLogWrapper.functionName = 'Check IN';
            objErrorLogWrapper.referenceID = 'N/A';
            objErrorLogWrapper.message = ex.getMessage();
            objErrorLogWrapper.objectName = 'Device Not Register';  
            objErrorLogWrapper.errorOperation = 'Device Not Register';
            objErrorLogWrapper.messageDescription = ex.getMessage();
            objErrorLogWrapper.ex = null;
            listErrorLogWrapper.add(objErrorLogWrapper);
            RMDErrorLogUtilityHelper.logError(listErrorLogWrapper);
            return 'Error Record Not Found';
        }
    }
   
    @AuraEnabled
    public static String checkOutFromOneApp(Decimal lat, Decimal lng,Id recordId,String recordTypeCheckin, Id userIds,String deviceNM) {
        system.debug('lat '+lat+ ' lng '+lng + 'recordId '+recordId+' recordTypeCheckin '+recordTypeCheckin);
         String locName= getLocationName(Double.valueOf(lat), Double.valueOf(lng));
        User u = [Select id,Mobile_Id__c from User where Id =: UserInfo.getUserId()];
        system.debug('==u==@@=='+u);
        
            Check_In__c ci = new Check_In__c();
            
            Boolean checkNetiveId = false;
            //RMD_Territory_Master__c tmc = [Select id, name, Depo_Geolocation__c from RMD_Territory_Master__c where id=:recordId];
            //system.debug('--tmc--'+tmc);
            List<Check_In__c> checkInList = [Select id,Check_In_Count__c,Check_Out__c,Check_Out_Time__c from  Check_In__c where Segment__c =: recordId and createdById =: UserInfo.getUserId() and CreatedDate = Today and Check_Out__Latitude__s = null and Check_Out__Longitude__s = null and Check_Out_Time__c = null order By CreatedDate Desc limit 1];
            system.debug('--checkInList--'+checkInList);
            system.debug('--checkInList-size-'+checkInList.size());
             List<Check_In__c> checkInListUpdate = new  List<Check_In__c>();
            //if(checkInList.size() > 0){
            for(Check_In__c co : checkInList){
                 system.debug('--co--'+co);
                Location locZip = Location.newInstance(lat, lng);
               // Double dist = Location.getDistance(locZip,tmc.Depo_Geolocation__c,'km');
               // Double dist2 = locZip.getDistance(tmc.Depo_Geolocation__c, 'km');
               // system.debug('dist2'+dist2);
                String checkInAllowed = System.label.Check_In_Allowed_Range;
                system.debug('checkInAllowed'+checkInAllowed);
              //  dist= dist*1000;
                //system.debug('dist'+dist);
              //  if(dist<=Integer.valueOf(checkInAllowed)){
                 //   co.Distance_Between_Depot_And_Check_In__c = dist;
                    co.Check_Out__Latitude__s = lat;
                    co.Check_Out__Longitude__s = lng;
                    co.Check_Out_Time__c = system.now();
                    co.Check_Out_Location_Name__c = locName;
                    checkInListUpdate.add(co);
                     system.debug('@--checkInListUpdate--@@'+checkInListUpdate);
            /*}
                else{
                    return 'Check Out Fail';
                }  */
          }
           system.debug('@--checkInListUpdate--@@'+checkInListUpdate);
            update checkInListUpdate;
            return 'Check Out Success';
        /*  }
            else{
                 return 'Check Out Fail';
            } */
       
    }

    
    @AuraEnabled 
    public static String checkInFromOneAppForDepo(Decimal lat, Decimal lng,Id recordId,String recordTypeCheckin, Id userIds, String mobId,String deviceNM) {
        system.debug('==mobId==@@=='+mobId);
        system.debug('lat '+lat+ ' lng '+lng + 'recordId '+recordId+' recordTypeCheckin '+recordTypeCheckin);
        User u = [Select id,Mobile_Id__c from User where Id =: userIds];
        system.debug('==u==@@=='+u);
        Date dt = system.today();
        String brow = '';
        String appl = '';
        String plate = '';
        List<LoginHistory> logHistory = [SELECT UserId, LoginTime, Browser, Application, Platform from LoginHistory WHERE
                                         LoginTime >=: dt and UserId =:userIds];
        system.debug('--@@--logHistory--@@'+logHistory);
        system.debug('--@@--logHistory--@@'+logHistory.size());
        for(LoginHistory lg : logHistory ){
            if(lg.Browser != 'Unknown' && brow == ''){
                brow = lg.Browser;
                appl = lg.Application;
                plate = lg.Platform;
            }
            else if(lg.Browser != 'Unknown' && brow != ''){
                brow = brow +' ,'+lg.Browser;
                appl = appl +' ,'+lg.Application;
                plate = plate +' ,'+lg.Platform;
            }
        }
            Check_In__c ci = new Check_In__c();
            
            Boolean checkNetiveId = false;
            
            
            
            /*  String st = 'Approved';
List<UserDevice> udList = [SELECT Id, Name,UserProvidedDeviceIdentifier, CreatedDate, CreatedById , SystemModstamp, UserId, DeviceType, DeviceNativeUid, Status, BrowserType, PlatformType, 
UserLastSeen, LastLoginHistoryId, IsVerified, PlatformVersion FROM UserDevice where UserId =: userIds and Status =: st];
system.debug('--udList--'+udList);
system.debug('--udList-S-'+udList.size());

List<UserDevice> userDeviceList = [SELECT Id, IsDeleted, Name, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById, 
SystemModstamp, UserId, DeviceType, DeviceNativeUid, Status, BrowserType, PlatformType, 
UserLastSeen, LastLoginHistoryId, IsVerified, PlatformVersion, UserProvidedDeviceIdentifier
FROM UserDevice where UserId =: userIds ];

userDeviceList[0].UserProvidedDeviceIdentifier = mobId;
update userDeviceList;*/
            RMD_Territory_Master__c tmc = [Select id, name, Depo_Geolocation__c from RMD_Territory_Master__c where id=:recordId];
            List<Check_In__c> checkInList = [Select id,Check_In_Count__c from  Check_In__c where Territory_Master__c =: recordId and createdById =: userIds and CreatedDate = Today order By CreatedDate Desc];
            system.debug('--checkInList--'+checkInList);
            system.debug('--checkInList-size-'+checkInList.size());
            ci.Browser__c = brow;
            ci.Application__c = appl;
            ci.Platform__c = plate;
            String locName= getLocationName(Double.valueOf(lat), Double.valueOf(lng));
            system.debug('==locName=='+locName);
            if(tmc.Depo_Geolocation__c == null){
                ci.Check_In_Location__Latitude__s = lat;
                ci.Check_In_Location__Longitude__s = lng;
                ci.Mobile_Id__c = mobId;
                ci.Device_Check_In__c  = deviceNM;
                ci.Territory_Master__c = recordId;
                ci.Check_In_Location_Name__c = locName;
                ci.Check_In_User__c = UserInfo.getUserId();
                if(checkInList.size() > 0){
                    ci.Check_In_Count__c = checkInList[0].Check_In_Count__c+1;
                }
                else{
                    system.debug('=u.Mobile_Id__c='+u.Mobile_Id__c);
                    system.debug('=mobId='+mobId);
                    if(u.Mobile_Id__c == null && mobId != null){
                        system.debug('=u.Mobile_Id__c='+u.Mobile_Id__c);
                        system.debug('=mobId='+mobId);
                        u.Mobile_Id__c = mobId;
                        update u;
                    }
                    system.debug('=u='+u);
                    ci.Check_In_Count__c = 1;
                    
                }
                //getLocationName
                insert ci;
                return 'Check In Success';
            }
            else{
                Location locZip = Location.newInstance(lat, lng);
                Double dist = Location.getDistance(locZip,tmc.Depo_Geolocation__c,'km');
                Double dist2 = locZip.getDistance(tmc.Depo_Geolocation__c, 'km');
                system.debug('dist2'+dist2);
                String checkInAllowed = System.label.Check_In_Allowed_Range;
                system.debug('checkInAllowed'+checkInAllowed);
                dist= dist*1000;
                system.debug('dist'+dist);
                if(dist<=Integer.valueOf(checkInAllowed)){
                    ci.Distance_Between_Depot_And_Check_In__c = dist;
                    ci.Check_In_Location__Latitude__s = lat;
                    ci.Check_In_Location__Longitude__s = lng;
                    ci.Territory_Master__c = recordId;
                    ci.Mobile_Id__c = mobId;
                     ci.Check_In_Location_Name__c = locName;
                    ci.Check_In_User__c = UserInfo.getUserId();
                    ci.Device_Check_In__c  = deviceNM;
                    if(checkInList.size() > 0){
                        ci.Check_In_Count__c = checkInList[0].Check_In_Count__c+1;
                    }
                    else{
                        ci.Check_In_Count__c = 1;
                        if(u.Mobile_Id__c == null && mobId != null){
                            u.Mobile_Id__c = mobId;
                            update u;
                        }
                    }
                    insert ci;
                    return 'Check In Success';
                }
                else{
                    system.debug('Else Part'+dist);
                    return 'Check In Failed';
                }
            }
        
    }
    
    @AuraEnabled 
    public static String checkInFromOneApp(Decimal lat, Decimal lng,Id recordId,String recordTypeCheckin) {
        system.debug('lat '+lat+ ' lng '+lng + 'recordId '+recordId+' recordTypeCheckin '+recordTypeCheckin);
           String locName= getLocationName(Double.valueOf(lat), Double.valueOf(lng));
        Check_In__c ci = new Check_In__c();
        if(recordTypeCheckin !=null){
            system.debug('recordTypeCheckin 19 =  '+recordTypeCheckin);
            
            //ci.Name = recordTypeCheckin;
        }
        else{
            RMD_Territory_Master__c tmc = [Select id, name, Depo_Geolocation__c from RMD_Territory_Master__c where id=:recordId];
            if(tmc.Depo_Geolocation__c!=null){
                Location locZip = Location.newInstance(lat, lng);
                Double dist = Location.getDistance(locZip,tmc.Depo_Geolocation__c,'km');
                Double dist2 = locZip.getDistance(tmc.Depo_Geolocation__c, 'km');
                system.debug('dist2'+dist2);
                String checkInAllowed = System.label.Check_In_Allowed_Range;
                system.debug('checkInAllowed--'+checkInAllowed);
                dist= dist*1000;
                if(dist<= Integer.valueOf(checkInAllowed)){
                    ci.Distance_Between_Depot_And_Check_In__c = dist;
                    ci.Check_In_Location__Latitude__s = lat;
                    ci.Check_In_Location__Longitude__s = lng;
                    ci.Check_In_Location_Name__c = locName;
                    ci.Check_In_User__c = UserInfo.getUserId();
                }
                else{
                    system.debug('----Error--In Else Part 66--');
                    
                }
                // metre
                system.debug('dist'+dist); 
            }
            else{
                ci.Check_In_Location_Name__c = locName;
                ci.Check_In_User__c = UserInfo.getUserId();
                ci.Territory_Master__c=recordId;
                // ci.Name = 'DEPOT';
                system.debug('recordTypeCheckin 25 =  '+recordTypeCheckin);
            }
            
            
        }       
        
        
        
        if(recordTypeCheckin !=null){
            system.debug('recordTypeCheckin 34 =  '+recordTypeCheckin);
            
            List<Segment__c> segList = [Select Id,Depot__c,CreatedDate,Last_Check_In_Date__c,Location_Approval_Status__c from Segment__c Where Id =: recordId and Location_Approval_Status__c != 'Approved'];  
            system.debug('---segList----'+segList);
            if(segList.size() > 0){
                Approval.UnlockResult[] lrList = Approval.unlock(segList);
            }
            
            Segment__c seg = [Select Id,Pending_For_Approval__c,Approved_Geolocation__c from Segment__c Where Id =: recordId Limit 1];
            system.debug('Segment '+seg);
            seg.Pending_For_Approval__Latitude__s = lat;
            seg.Pending_For_Approval__Longitude__s = lng;
            seg.Check_In_Location_Name__c = locName;
            //seg.Check_In_User__c = UserInfo.getUserId();
            ci.Segment__c = seg.Id;
            
            if(seg != null ){
                update seg;    
                return 'Check In Success';
            }
            
            
        }
        if(ci != null){
            system.debug('--ci--'+ci);
            insert ci;    
            return 'Check In Success';
            
        }
        else{
            return 'Check In Failed';
        }        
    }
    
    @AuraEnabled
    public static string checkInSecondTime(Decimal lat, Decimal lng,Id recordId,String recordTypeCheckin) {
        system.debug('lat '+lat+ ' lng '+lng + 'recordId '+recordId+' recordTypeCheckin '+recordTypeCheckin);
        string str;
         String locName= getLocationName(Double.valueOf(lat), Double.valueOf(lng));
        Segment__c seg = [Select Id,Name,Pending_For_Approval__c,Approved_Geolocation__c from Segment__c Where Id =: recordId Limit 1];
        Check_In__c ci = new Check_In__c();
        //ci.Name = recordTypeCheckin;
        ci.Check_In_Location__Latitude__s = lat;
        ci.Check_In_Location__Longitude__s = lng;
        ci.Segment__c = seg.Id;
        ci.Check_In_Location_Name__c = locName;
        ci.Check_In_User__c = UserInfo.getUserId();
        //ci.Name = 'Depo';
        if(ci != null){
            insert ci;    
        }
        
        
        Boolean flag = False;
        If(seg.Approved_Geolocation__c != null){
            Location locZip = Location.newInstance(lat, lng);
            Double dist = Location.getDistance(locZip,seg.Approved_Geolocation__c,'km');
            Double dist2 = locZip.getDistance(seg.Approved_Geolocation__c, 'km');
            system.debug('dist2'+dist2);
            // Use lable 
            dist= dist*1000;
            if(dist<=2000){
                flag = true;
            }
            // metre
            system.debug('dist'+dist);    
        }
        else{
            List<Segment__c> segList = [Select Id,Depot__c,CreatedDate,Last_Check_In_Date__c,Location_Approval_Status__c from Segment__c Where Id =: recordId and Location_Approval_Status__c != 'Approved'];  
            system.debug('---segList----'+segList);
            if(segList.size() > 0){
                Approval.UnlockResult[] lrList = Approval.unlock(segList, false);
            }
            seg.Pending_For_Approval__Latitude__s = lat;
            seg.Pending_For_Approval__Longitude__s = lng;
            //seg.Pending_For_Approval1__Latitude__s = lat;
            //seg.Pending_For_Approval1__Longitude__s = lng;  
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
            dist= dist*1000;
            if(dist<=200){
                flag = true;
            }
            // metre
            system.debug('dist'+dist);    
        }
        else{
            // seg.Pending_For_Approval__Latitude__s = lat;
            //seg.Pending_For_Approval__Longitude__s = lng;
            //seg.Pending_For_Approval1__Latitude__s = lat;
            //seg.Pending_For_Approval1__Longitude__s = lng;  
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
        /*Segment__c seg = [Select Id,Depot__c,CreatedDate from Segment__c Where Id =: recordId Limit 1];
system.debug('seg '+seg);

RMD_Territory_Master__c tm = [Select Id,Name_Of_Newspaper__c From RMD_Territory_Master__c Where Id=:seg.Depot__c]; 
system.debug('tm '+tm);

String[] tmpString = tm.Name_Of_Newspaper__c.split(';');

for(String s : tmpString){
Transactional_Details__c td = new Transactional_Details__c();
td.name = s;
td.Segment__c = seg.Id;
td.FTD_Count__c = 0;
DateTime dT = seg.CreatedDate;
Date myDate = date.newinstance(dT.year(), dT.month(), dT.day());
td.CheckInDate__c = myDate;
tdList.add(td);
}
system.debug('tdlList '+tdList);

if(tdList.size()>0){
insert tdList; 
} */
        
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
        
        Segment__c seg = [Select Id,Depot__c,Depot__r.RMD_Branch__c,CreatedDate,Segment_Branch__c,Last_Check_In_Date__c from Segment__c Where Id =: recordId Limit 1];
        system.debug('---seg--'+seg);
        
        List<Product2> productList = [Select id, Name,RecordTypeId from Product2 where  RMD_Branch__c =:seg.Segment_Branch__c
                                      and RecordTypeId =: recordTypeId and Mandatory_For_RWA__c= true and isActive= true];
        system.debug('---productList--'+productList);
        
        for(Product2 pro : productList){
            selectedNP.add(pro.Name);
        }
        system.debug('--selectedNP---@@='+selectedNP);
        
        
        List<Transactional_Details__c> txnDetailsList = [Select Id,Name,Last_Visit__c,FTD_Covid_Count__c,Second_Last_Visit_Date__c,Second_Last_Visit__c,Segment__c,Is_Pre_Covid_Count__c,
                                                         FTD_Count__c,Visit_Date__c,CheckInDate__c From Transactional_Details__c 
                                                         where Segment__c =:seg.Id and Is_Pre_Covid_Count__c = false order by CreatedDate ASC ];
        
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
                    //dt.lastdate = td.FTD_Count__c;
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
            String dateStr = seg.Last_Check_In_Date__c.day() + '/' + seg.Last_Check_In_Date__c.month() + '/' + seg.Last_Check_In_Date__c.year();
            dh.lastVisit = dateStr;
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
        
        //* if Last check In Date  equal blank than show mandtory news paper
        
        /*  for(String s : selectedNP){

dataTable dt = new dataTable();
dt.name = s;
dt.secondlastdate = 0;
dt.lastdate = 0;
dt.ftdcount = 0;
dt.count = 0;
mapOfName.put(s,dt);
}
system.debug('mapOfName--@@'+mapOfName);

//*if Last check In Date not equal blank than show existing txn

if( seg.Last_Check_In_Date__c != null){



for(Transactional_Details__c td : txnDetailsList){

system.debug('--td.Last_Visit__c--'+td.Last_Visit__c);
if ( td.Is_Pre_Covid_Count__c == false && td.Last_Visit__c > 0 && !stSet.contains(td.Name)){
dataTable dt = new dataTable();
dt.name = td.Name;
dt.secondlastdate = td.Second_Last_Visit__c;
dt.lastdate = td.Last_Visit__c;
dt.ftdcount = 0;
dt.count = 0;
stSet.add(td.Name);
//  if(!stSet.contains(td.Name)){
mapOfName.put(td.Name,dt); 
//   }
system.debug('--mapOfName--'+mapOfName);
system.debug('--mapOfName--'+mapOfName.size());
dh.covidCheck = false;
//dataTable dts = mapOfName.get(td.Name);
//dtsList.add(dts);
//mapOfName.put(td.Name,dts);
}
else if( td.Is_Pre_Covid_Count__c == true  ){
//&& td.Last_Visit__c > 0    && !stSet.contains(td.Name)
dataTable dt = new dataTable();
dt.name = td.Name;
dt.secondlastdate = td.Second_Last_Visit__c;
dt.lastdate = td.Last_Visit__c;
dt.ftdcount = 0;
dt.count = td.FTD_Covid_Count__c;
dh.covidCheck = true;
stSet.add(td.Name);
//  if(!stSet.contains(td.Name)){
mapOfName.put(td.Name,dt); 
//   }
system.debug('--mapOfName--'+mapOfName);
system.debug('--mapOfName--'+mapOfName.size());
}

}
dh.lastVisit = String.valueOf(seg.Last_Check_In_Date__c);
dh.visitDate = seg.Last_Check_In_Date__c;
}

//* if Last check In Date  equal blank and Is Covid Count true than show mandtory news paper
else if(seg.Last_Check_In_Date__c == null){
for(Transactional_Details__c td : txnDetailsList){
if(td.Is_Pre_Covid_Count__c == true){
dataTable dt = new dataTable();
dt.name = td.Name;
dt.secondlastdate = td.Second_Last_Visit__c;
dt.lastdate = td.Last_Visit__c;
dt.ftdcount = 0;
dt.count = td.FTD_Covid_Count__c;
stSet.add(td.Name);
mapOfName.put(td.Name,dt); 

dh.covidCheck = true;
}
}
}

//* if Last check In Date  equal blank and Is Covid Count false than show mandtory news paper
else if(seg.Last_Check_In_Date__c == null){
for(String s : selectedNP){
dataTable dt = new dataTable();
dt.name = s;
dt.secondlastdate = 0;
dt.lastdate = 0;
dt.ftdcount = 0;
dt.count = 0;
mapOfName.put(s,dt);
dh.covidCheck = false;
dh.visitDate =  null;
}
}
for(String s: mapOfname.keyset()){
system.debug('--s--'+s);
dataTable dt = mapOfName.get(s);
dtsList.add(dt);
}
dataList dts = new dataList();


dts.dataTable= dtsList;
dts.dataHeader = dh;
system.debug('--dts-'+dts);

/*
RMD_Territory_Master__c tm = [Select Id,Name_Of_Newspaper__c From RMD_Territory_Master__c Where Id=:seg.Depot__c];
system.debug('tm 168 =  '+tm);  
String[] tmpString = tm.Name_Of_Newspaper__c.split(';');
for(String s : tmpString){

dataTable dt = new dataTable();
dt.name = s;
dt.secondlastdate = 0;
dt.lastdate = 0;
dt.ftdcount = 0;
dt.count = 0;

mapOfName.put(s,dt);
}
system.debug('mapOfName =  '+mapOfName);
List<Transactional_Details__c> tdl = [Select Id,Name,Last_Visit__c,Second_Last_Visit_Date__c,Second_Last_Visit__c,Segment__c,FTD_Count__c,Visit_Date__c,CheckInDate__c From Transactional_Details__c where Segment__c =:seg.Id order by CreatedDate Desc];
system.debug('tdl 184 = '+tdl);
List<dataTable> dtsList = new List<dataTable>();
dataheader dh = new dataHeader();
for(Transactional_Details__c td : tdl){
if (!(mapOfName.containsKey(td.Name))){
dataTable dt = new dataTable();
dt.name = td.Name;
dt.secondlastdate = td.Second_Last_Visit__c;
dt.lastdate = td.Last_Visit__c;
dt.ftdcount = td.FTD_Count__c;
dt.count = td.FTD_Count__c;
mapOfName.put(td.Name,dt); 
}
system.debug('mapOfName = '+mapOfName);

dataTable dts = mapOfName.get(td.Name);

system.debug('dts = '+dts);
system.debug('dts.count = '+dts.count);
if(dts.count == 0){
if(dh.lastVisit==null){
dh.lastVisit = string.valueof(td.CheckInDate__c);
system.debug('line 139= '+dh.lastVisit);
dh.secondLastVisit = string.valueof(td.Second_Last_Visit_Date__c);

}
if(td.Last_Visit__c == null){
dts.lastdate = td.FTD_Count__c;	 
dts.secondlastdate = td.Second_Last_Visit__c;
}
else{
//dts.lastdate = td.Visit_Date__c;
dts.lastdate = td.Last_Visit__c;

dts.secondlastdate = td.Second_Last_Visit__c;
}
dts.count = 1;
// dtsList.add(dts);
mapOfName.put(td.Name,dts);
}
if(dts.count == 1){
if(dh.lastVisit==null){
// dh.secondLastVisit = string.valueof(td.Second_Last_Visit_Date__c);
system.debug('line 154= '+dh.secondLastVisit);
}
// dts.secondlastdate = td.Second_Last_Visit__c;
//dts.count = 2;

//dtsList.add(dts);
//mapOfName.put(td.Name,dts);
}

}   
for(String s: mapOfname.keyset()){
dataTable dt = mapOfName.get(s);
dtsList.add(dt);
}
dataList dts = new dataList();
dts.dataTable= dtsList;
dts.dataHeader = dh;

//List<Transactional_Details__c> tdls = [Select Id,Name,Last_Visit__c,Second_Last_Visit__c,Segment__c,FTD_Count__c From Transactional_Details__c where Id In:tdlList];
system.debug('td data '+dts); 


return  dts; */
        
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
                            //Transactional_Details__c txnRec = tdsMap.get(st.name);
                            //system.debug('txnRec--@@'+txnRec);
                            // td.Last_Visit__c = st.ftdcount;
                            //td.Second_Last_Visit__c = txnRec.Last_Visit__c;
                            //td.Second_Last_Visit_Date__c = txnRec.CheckInDate__c; 
                            //dts.secondLastVisit = string.valueof(txnRec.CheckInDate__c);
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
    
    
    
    
    // Method to get location name based on latitude and longitude
    public static String getLocationName(Double latitude, Double longitude) {
        String GOOGLE_API_KEY = 'AIzaSyDnlcIqi44kS67grWnWQrgaHBM4cqpQJ1U';
        String locationName = '';
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&key=' + GOOGLE_API_KEY);
        request.setMethod('GET');
        
        try {
            HttpResponse response = http.send(request);
            
            if (response.getStatusCode() == 200) {
                // Parse the JSON response
                Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                if (jsonResponse.containsKey('results')) {
                    List<Object> results = (List<Object>) jsonResponse.get('results');
                    if (!results.isEmpty()) {
                        Map<String, Object> firstResult = (Map<String, Object>) results[0];
                        if (firstResult.containsKey('formatted_address')) {
                            locationName = (String) firstResult.get('formatted_address');
                        }
                    }
                }
            } else {
                System.debug('Error from Google Geocoding API: ' + response.getBody());
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        system.debug('==locationName=='+locationName);
        return locationName;
        
    }
}