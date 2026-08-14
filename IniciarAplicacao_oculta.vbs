' Launcher oculto da aplicacao (sem janela de comando visivel).
' Clica duplamente neste ficheiro para arrancar o servidor em segundo plano.
Option Explicit

Dim fso, shell, dir, npmCmd

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

' Pasta onde este .vbs esta guardado (raiz do projeto)
dir = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = dir

' Arranca o servidor de desenvolvimento com a janela de comando oculta.
' (A janela fica escondida; a consola nao e mostrada.)
If fso.FileExists(dir & "\node_modules\.bin\next.cmd") Then
    npm = "npm run dev"
Else
    npm = "npm run start"
End If

shell.Run "cmd /c """ & npm & """", 0, False