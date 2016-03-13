#!/usr/bin/env python
"""
Wraps gpspipe in order to pass Chrome Native Messaging protocol messages.

Copyright 2016 Michael Farrell <micolous+git@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.


gpspipe must be in your PATH for this script to work.

ref: https://developer.chrome.com/extensions/nativeMessaging
"""
from subprocess import *
from struct import pack
from sys import stdout

process = Popen(['gpspipe', '-w'], stdin=PIPE, stdout=PIPE)

try:
	while process.returncode is None:
		process.poll()
		line = process.stdout.readline()

		if len(line) == 0:
			# Drop empty lines
			continue

		# Lines from gpspipe are already json, yay!
		line = line.strip().encode('utf-8')

		# Protocol is to have a JSON blob preceeded with a uint32 in native byte
		# order.
		stdout.write(pack('=L', len(line)) + line)

		# Flush the output immediately.
		stdout.flush()
except KeyboardInterrupt:
	# Swallow the exception message
	pass
finally:
	# Make sure the child process is dead.
	try:
		process.kill()
	except:
		pass

