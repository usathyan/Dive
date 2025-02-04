!macro customUnInstall
  ; Define the process name of your Electron app
  StrCpy $0 "Dive.exe"

  ; Check if the application is running
  nsExec::ExecToStack 'tasklist /FI "IMAGENAME eq $0" /NH'
  Pop $1

  StrCmp $1 "" notRunning
  
  ; If the app is running, notify the user and attempt to close it		
  MessageBox MB_OK "Dive is being uninstalled." IDOK forceClose

  forceClose:
    ; Attempt to kill the running application
    nsExec::ExecToStack 'taskkill /F /IM $0'
    Pop $1

    ; Proceed with uninstallation
    Goto continueUninstall

  notRunning:
    ; If the app is not running, proceed with uninstallation
    Goto continueUninstall

  continueUninstall:
    ; Proceed with uninstallation
    DeleteRegKey HKLM "Software\Dive"
    RMDir /r "$INSTDIR"
    Delete "$INSTDIR\*.*"

    ; Clean up shortcuts and app data
    Delete "$DESKTOP\Dive.lnk"
    Delete "$STARTMENU\Programs\Dive.lnk"
    RMDir /r "$APPDATA\Dive"
    RMDir /r "$PROFILE\.dive"

    ; Close the uninstaller
    Quit
!macroend