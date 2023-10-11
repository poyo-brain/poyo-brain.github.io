import json
import re

def extract_info_from_filename(filename):
    # Regular expression patterns for each component
    animal_name_pattern = re.compile(r'(Mihili|Chewie|MrT|Jaco|indy|loco)')
    task_type_pattern = re.compile(r'(CO|RT)')
    recording_date_pattern = re.compile(r'(\d{8})')

    # Search for each component in the filename
    animal_name_match = animal_name_pattern.search(filename)
    task_type_match = task_type_pattern.search(filename)
    recording_date_match = recording_date_pattern.search(filename)

    # If all components are found, extract and reformat them
    if animal_name_match and task_type_match and recording_date_match:
        animal_name = animal_name_match.group(0)
        task_type = task_type_match.group(0)
        recording_date = recording_date_match.group(0)

        # Decide the format based on the position relative to task_type in the filename
        if filename.index(recording_date) < filename.index(task_type):
            # Assume yyyymmdd format
            recording_date = f"{recording_date[0:4]}{recording_date[4:6]}{recording_date[6:8]}"
        else:
            # Assume mmddyyyy format
            recording_date = f"{recording_date[4:]}{recording_date[0:2]}{recording_date[2:4]}"

        return animal_name.lower(), task_type, recording_date
    else:
        raise ValueError(f"Unexpected filename: {filename}")

monkey_dict = {'Chewie_20131003_CO_VR_BL_001_stripped': 0,
     'Chewie_20131022_CO_FF_BL_001_stripped': 1,
     'Chewie_20131023_CO_FF_BL_001_stripped': 2,
     'Chewie_20131028_RT_FF_BL_001_stripped': 3,
     'Chewie_20131031_CO_FF_BL_001_stripped': 4,
     'Chewie_20131101_CO_FF_BL_001_stripped': 5,
     'Chewie_20131203_CO_FF_BL_001_stripped': 6,
     'Chewie_20131204_CO_FF_BL_001_stripped': 7,
     'Chewie_20131219_CO_VR_BL_001_stripped': 8,
     'Chewie_20131220_CO_VR_BL_001_stripped': 9,
     'Chewie_20150309_CO_CS_BL_001_stripped': 10,
     'Chewie_20150311_CO_CS_BL_001_stripped': 11,
     'Chewie_20150312_CO_CS_BL_001_stripped': 12,
     'Chewie_20150313_CO_CS_BL_001_stripped': 13,
     'Chewie_20150316_RT_CS_BL_001_stripped': 14,
     'Chewie_20150317_RT_CS_BL_001_stripped': 15,
     'Chewie_20150318_RT_CS_BL_001_stripped': 16,
     'Chewie_20150319_CO_CS_BL_001_stripped': 17,
     'Chewie_20150320_RT_CS_BL_001_stripped': 18,
     'Chewie_20161005_CO_FF_BL_001_stripped': 19,
     'Chewie_20161006_CO_VR_BL_001_stripped': 20,
     'Chewie_20161007_CO_FF_BL_001_stripped': 21,
     'Chewie_CO_CS_BL_11032015_002_stripped': 22,
     'Chewie_CO_CS_BL_11042015_002_stripped': 23,
     'Chewie_CO_CS_BL_11062015_001_stripped': 24,
     'Chewie_CO_FF_BL_06292015_001_stripped': 25,
     'Chewie_CO_FF_BL_06302015_001_stripped': 26,
     'Chewie_CO_FF_BL_07012015_001_stripped': 27,
     'Chewie_CO_FF_BL_07032015_001_stripped': 28,
     'Chewie_CO_FF_BL_07062015_001_stripped': 29,
     'Chewie_CO_FF_BL_07072015_001_stripped': 30,
     'Chewie_CO_FF_BL_07082015_001_stripped': 31,
     'Chewie_CO_FF_BL_09152016_001_stripped': 32,
     'Chewie_CO_FF_BL_09192016_001_stripped': 33,
     'Chewie_CO_FF_BL_09212016_001_stripped': 34,
     'Chewie_CO_FF_BL_10052016_001_stripped': 35,
     'Chewie_CO_FF_BL_10072016_001_stripped': 36,
     'Chewie_CO_GR_BL_11092015_001_stripped': 37,
     'Chewie_CO_GR_BL_11102015_001_stripped': 38,
     'Chewie_CO_GR_BL_11122015_001_stripped': 39,
     'Chewie_CO_GR_BL_11132015_001_stripped': 40,
     'Chewie_CO_GR_BL_11162015_001_stripped': 41,
     'Chewie_CO_GR_BL_11172015_001_stripped': 42,
     'Chewie_CO_GR_BL_11202015_001_stripped': 43,
     'Chewie_CO_VR_BL_07092015_001_stripped': 44,
     'Chewie_CO_VR_BL_07102015_001_stripped': 45,
     'Chewie_CO_VR_BL_07132015_001_stripped': 46,
     'Chewie_CO_VR_BL_07142015_001_stripped': 47,
     'Chewie_CO_VR_BL_07152015_001_stripped': 48,
     'Chewie_CO_VR_BL_07162015_001_stripped': 49,
     'Chewie_CO_VR_BL_09092016_001_stripped': 50,
     'Chewie_CO_VR_BL_09122016_001_stripped': 51,
     'Chewie_CO_VR_BL_09142016_001_stripped': 52,
     'Chewie_CO_VR_BL_09292016_001_stripped': 53,
     'Chewie_CO_VR_BL_10062016_001_stripped': 54,
     'Chewie_CO_VR_BL_11192015_001_stripped': 55,
     'Chewie_CO_VR_BL_12012015_001_stripped': 56,
     'Chewie_RT_FF_BL_10292013_001_stripped': 57,
     'Chewie_RT_FF_BL_12092013_001_stripped': 58,
     'Chewie_RT_FF_BL_12102013_001_stripped': 59,
     'Chewie_RT_FF_BL_12172013_001_stripped': 60,
     'Chewie_RT_FF_BL_12182013_001_stripped': 61,
     'Chewie_RT_VR_BL_10092013_001_stripped': 62,
     'Chewie_RT_VR_BL_10102013_001_stripped': 63,
     'Chewie_RT_VR_BL_10112013_001_stripped': 64,
     'Chewie_RT_VR_BL_12122013_001_stripped': 65,
     'Chewie_RT_VR_BL_12132013_001_stripped': 66,
     'Mihili_20140303_CO_VR_BL_001_stripped': 67,
     'Mihili_20140304_CO_VR_BL_001_stripped': 68,
     'Mihili_20140306_CO_VR_BL_001_stripped': 69,
     'Mihili_20140307_CO_FF_BL_001_stripped': 70,
     'Mihili_CO_CS_BL_05112015_001_stripped': 71,
     'Mihili_CO_CS_BL_05122015_001_stripped': 72,
     'Mihili_CO_CS_BL_06262014_001_stripped': 73,
     'Mihili_CO_CS_BL_06272014_001_stripped': 74,
     'Mihili_CO_CS_BL_09292014_001_stripped': 75,
     'Mihili_CO_CS_BL_12032014_001_stripped': 76,
     'Mihili_CO_FF_BL_02032014_001_stripped': 77,
     'Mihili_CO_FF_BL_02172014_001_stripped': 78,
     'Mihili_CO_FF_BL_02182014_001_stripped': 79,
     'Mihili_CO_FF_BL_06102015_001_stripped': 80,
     'Mihili_CO_FF_BL_06112015_001_stripped': 81,
     'Mihili_CO_FF_BL_06122015_001_stripped': 82,
     'Mihili_CO_FF_BL_06152015_001_stripped': 83,
     'Mihili_CO_FF_BL_06162015_001_stripped': 84,
     'Mihili_CO_FF_BL_06172015_001_stripped': 85,
     'Mihili_CO_VR_BL_03032014_001_stripped': 86,
     'Mihili_CO_VR_BL_03062014_001_stripped': 87,
     'Mihili_CO_VR_BL_06232015_001_stripped': 88,
     'Mihili_CO_VR_BL_06252015_001_stripped': 89,
     'Mihili_CO_VR_BL_06262015_001_stripped': 90,
     'Mihili_RT_FF_BL_02142014_001_stripped': 91,
     'Mihili_RT_FF_BL_02212014_001_stripped': 92,
     'Mihili_RT_FF_BL_02242014_001_stripped': 93,
     'Mihili_RT_VR_BL_01142014_001_stripped': 94,
     'Mihili_RT_VR_BL_01152014_001_stripped': 95,
     'Mihili_RT_VR_BL_01162014_001_stripped': 96,
     'Jaco_CO_FF_BL_04052016_001_stripped': 97,
     'Jaco_CO_FF_BL_04062016_001_stripped': 98,
     'Jaco_CO_FF_BL_04072016_001_stripped': 99,
     'indy_20160624_03_RT': 100,
     'indy_20160630_01_RT': 101,
     'indy_20160407_02_RT': 102,
     'loco_20170302_02_RT': 103,
     'indy_20161027_03_RT': 104,
     'indy_20160927_04_RT': 105,
     'loco_20170227_04_RT': 106,
     'indy_20161212_02_RT': 107,
     'indy_20170124_01_RT': 108,
     'loco_20170228_02_RT': 109,
     'indy_20161206_02_RT': 110,
     'indy_20170127_03_RT': 111,
     'indy_20160916_01_RT': 112,
     'indy_20160927_06_RT': 113,
     'loco_20170215_02_RT': 114,
     'indy_20160418_01_RT': 115,
     'indy_20160420_01_RT': 116,
     'indy_20161207_02_RT': 117,
     'indy_20161011_03_RT': 118,
     'indy_20160419_01_RT': 119,
     'indy_20160930_05_RT': 120,
     'indy_20160411_01_RT': 121,
     'indy_20161006_02_RT': 122,
     'indy_20160930_02_RT': 123,
     'indy_20161024_03_RT': 124,
     'indy_20161005_06_RT': 125,
     'indy_20170131_02_RT': 126,
     'indy_20160627_01_RT': 127,
     'indy_20160921_01_RT': 128,
     'indy_20160411_02_RT': 129,
     'indy_20161220_02_RT': 130,
     'loco_20170301_05_RT': 131,
     'indy_20160622_01_RT': 132,
     'indy_20160915_01_RT': 133,
     'indy_20161026_03_RT': 134,
     'indy_20161025_04_RT': 135,
     'loco_20170213_02_RT': 136,
     'indy_20170123_02_RT': 137,
     'loco_20170210_03_RT': 138,
     'indy_20161017_02_RT': 139,
     'indy_20160426_01_RT': 140,
     'indy_20161013_03_RT': 141,
     'indy_20161014_04_RT': 142,
     'indy_20161007_02_RT': 143,
     'sub-Nitschke_ses-20090910_behavior+ecephys_RT': 144,
     'sub-Nitschke_ses-20090812_behavior+ecephys_RT': 145,
     'sub-Nitschke_ses-20090922_behavior+ecephys_RT': 146,
     'sub-Nitschke_ses-20090920_behavior+ecephys_RT': 147,
     'sub-Nitschke_ses-20090819_behavior+ecephys_RT': 148,
     'sub-Jenkins_ses-20090912_behavior+ecephys_Maze': 149,
     'sub-Jenkins_ses-20090916_behavior+ecephys_Maze': 150,
     'sub-Jenkins_ses-20090918_behavior+ecephys_Maze': 151,
     'sub-Jenkins_ses-20090923_behavior+ecephys_Maze': 152,
     'Flint_2012_e1_CO': 153,
     'Flint_2012_e3_CO': 154,
     'Flint_2012_e4_CO': 155,
     'Flint_2012_e2_CO': 156,
     'Flint_2012_e5_CO': 157,
}

num_sess = len(monkey_dict)
types = [None for _ in range(num_sess)]

monkey_names = list(monkey_dict.keys())
for i in range(num_sess):
    if 'Chewie' in monkey_names[i]:
        types[i] = 'C'
    elif 'Mihili' in monkey_names[i]:
        types[i] = 'M'
    elif 'Jaco' in monkey_names[i]:
        types[i] = 'J'
    elif 'indy' in monkey_names[i]:
        types[i] = 'I'
    elif 'loco' in monkey_names[i]:
        types[i] = 'L'
    elif 'sub-Nitschke' in monkey_names[i]:
        types[i] = 'N'
    elif 'sub-Jenkins' in monkey_names[i]:
        types[i] = 'Je'
    elif 'Flint' in monkey_names[i]:
        types[i] = 'F'
    else:
        raise ValueError('Unknown monkey name: %s' % monkey_names[i])

print(types)

json_dict = {'types': types, 'names': list(monkey_dict.keys())}

# Save keys as JSON
with open('sess_metadata.json', 'w') as f:
    json.dump(json_dict, f)

for k in monkey_dict.keys():
    print(k)
    print(extract_info_from_filename(k))
