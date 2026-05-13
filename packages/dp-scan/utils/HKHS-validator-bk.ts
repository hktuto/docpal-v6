

function checkCat(rule, value, callback, allData, SectionWithValues) {
  const isHKHS = allData.SpecificField.HKHS === 'Y';
    const isHA = allData.SpecificField.HA === 'Y';
    if (isHA) {
      callback(new Error('Invalid category for HA'));
    }
    const familyCount = allData.ApplicantFamilyMemberList.length;

    const applicantBaby = allData['Applicant Info'].ApplicantFemalePregnanted16week === 'Y';
    const familyBaby = allData.ApplicantFamilyMemberList.reduce((result, cu) => { result += (cu.FamilyMemberPregnanted16Week === 'Y' ? 1 : 0); return result }, 0);

    const isManyPeople = !!(familyBaby > 0 || applicantBaby || familyCount > 0);

    if (isManyPeople) {
      if (value !== '1' && value !== '3') {
        callback(new Error('Invalid category'));
      }
    } else {
      if (value !== '2' && value !== '4') {
        callback(new Error('Invalid category'));
      }
    }
    callback()
}
