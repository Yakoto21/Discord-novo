Set WshShell = CreateObject("WScript.Shell")
' Inicia o servidor em segundo plano totalmente invisivel (0 = Oculto)
WshShell.Run "cmd /c node dist/server.cjs", 0, False

' Aguarda 1.5 segundos para o servidor subir
WScript.Sleep 1500

' Abre a interface do Discord Quantum diretamente
WshShell.Run "cmd /c start http://localhost:3000", 0, False
