$filePath1 = 'src/app/api/jangadas/route.ts'
$content1 = Get-Content $filePath1 -Raw
$content1 = $content1 -replace 'const data = await req\.json\(\);\s*const cylinderDataProxTeste', "const data = await req.json();
    const existingJangada = await prisma.jangada.findUnique({ where: { serial: data.serial } });
    if (existingJangada) return NextResponse.json({ error: \"J&aacute; existe uma jangada com esse n&uacute;mero de s&eacute;rie.\" }, { status: 400 });
    const cylinderDataProxTeste"
Set-Content -Path $filePath1 -Value $content1

$filePath2 = 'src/app/api/navios/route.ts'
$content2 = Get-Content $filePath2 -Raw
$content2 = $content2 -replace 'const data = await applyResolvedIslandToNavioPayload', "const data = await applyResolvedIslandToNavioPayload"
Set-Content -Path $filePath2 -Value $content2
