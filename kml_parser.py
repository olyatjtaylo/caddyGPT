from xml.dom import minidom

def parse_kml(file):
    try:
        # Basic KML parsing logic
        xmldoc = minidom.parse(file)
        courses = []
        for course in xmldoc.getElementsByTagName('Placemark'):
            name = course.getElementsByTagName('name')[0].firstChild.data
            courses.append({'name': name})
        return courses
    except Exception as e:
        print(f"Error parsing KML: {e}")
        return None

