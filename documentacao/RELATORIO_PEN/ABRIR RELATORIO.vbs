Dim fso, shell, scriptDir, htmlPath
Set fso   = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
htmlPath  = scriptDir & "\_app\RELATORIO_INSPECAO_SURVITEC_MODERNO.html"

If Not fso.FileExists(htmlPath) Then
    MsgBox "Ficheiro do relat" & Chr(243) & "rio n" & Chr(227) & "o encontrado." & vbCrLf & _
           htmlPath, 16, "Erro de abertura"
Else
    shell.Run "cmd /c start msedge """ & htmlPath & """", 0, False
End If

Set fso   = Nothing
Set shell = Nothing
