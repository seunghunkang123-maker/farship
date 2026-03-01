const fs = require('fs');

const file = 'components/views/CharacterDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/updateSecretField/g, "updateProfileField");
content = content.replace(/editLayer === 'SECRET'/g, "activeProfileId !== 'BASE'");
content = content.replace(/editLayer === 'PUBLIC'/g, "activeProfileId === 'BASE'");
content = content.replace(/editLayer/g, "activeProfileId");

content = content.replace(/const current = formData\.secretProfile\?\.extraFiles \|\| \[\];/g, "const profile = formData.profiles?.find(p => p.id === activeProfileId);\n        const current = profile?.extraFiles || [];");
content = content.replace(/updateProfileField\('extraFiles', singleUpdater\(formData\.secretProfile\?\.extraFiles \|\| \[\]\)\);/g, "const profile = formData.profiles?.find(p => p.id === activeProfileId);\n             updateProfileField('extraFiles', singleUpdater(profile?.extraFiles || []));");

content = content.replace(/const current = formData\.secretProfile\?\.comments \|\| \[\];/g, "const profile = formData.profiles?.find(p => p.id === activeProfileId);\n            const current = profile?.comments || [];");

content = content.replace(/formData\.secretProfile\?\.image_url/g, "formData.profiles?.find(p => p.id === activeProfileId)?.image_url");
content = content.replace(/formData\.secretProfile\?\.alias/g, "formData.profiles?.find(p => p.id === activeProfileId)?.alias");
content = content.replace(/formData\.secretProfile\?\.name/g, "formData.profiles?.find(p => p.id === activeProfileId)?.name");
content = content.replace(/formData\.secretProfile\.alias/g, "formData.profiles?.find(p => p.id === activeProfileId)?.alias");
content = content.replace(/formData\.secretProfile/g, "formData.profiles?.find(p => p.id === activeProfileId)");

fs.writeFileSync(file, content);
console.log('Done!');
