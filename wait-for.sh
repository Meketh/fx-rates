#!/bin/sh
# original script: https://github.com/eficode/wait-for/blob/master/wait-for

TIMEOUT=15
QUIET=0

echoerr() {
  if [ "$QUIET" -ne 1 ]; then
    printf "%s\n" "$*" 1>&2
  fi
}

usage() {
  exitcode="$1"
  cat << USAGE >&2
Usage:
  wait-for (host:port OR -f file) [-t timeout] [-q] [-- command args]
  -f FILE | --file=file               Wait for a file instead of a connection
  -t TIMEOUT | --timeout=timeout      Timeout in seconds, zero for no timeout
  -q | --quiet                        Do not output any status messages
  -- COMMAND ARGS                     Execute command with args after the test finishes
USAGE
  exit "$exitcode"
}

wait_for() {
  if [ -z "$FILE" ] ; then
    for i in `seq $TIMEOUT` ; do
      nc -z "$HOST" "$PORT" > /dev/null 2>&1
      result=$?
      if [ $result -eq 0 ] ; then
        if [ $# -gt 0 ] ; then
          echo "$@"
          exec "$@"
        fi
        exit 0
      fi
      sleep 1
    done
  else
    for i in `seq $TIMEOUT` ; do
      if [ -f "$FILE" ] ; then
        if [ $# -gt 0 ] ; then
          echo "$@" "$FILE"
          exec "$@" "$FILE"
        fi
        exit 0
      fi
      sleep 1
    done
  fi
  echo "Operation timed out" >&2
  exit 1
}

while [ $# -gt 0 ]
do
  case "$1" in
    *:* )
    HOST=$(printf "%s\n" "$1"| cut -d : -f 1)
    PORT=$(printf "%s\n" "$1"| cut -d : -f 2)
    shift 1
    ;;
    -q | --quiet)
    QUIET=1
    shift 1
    ;;
    -t)
    TIMEOUT="$2"
    if [ "$TIMEOUT" = "" ]; then break; fi
    shift 2
    ;;
    --timeout=*)
    TIMEOUT="${1#*=}"
    shift 1
    ;;
    -f)
    FILE="$2"
    if [ "$FILE" = "" ]; then break; fi
    shift 2
    ;;
    --file=*)
    FILE="${1#*=}"
    shift 1
    ;;
    --)
    shift
    break
    ;;
    --help)
    usage 0
    ;;
    *)
    echoerr "Unknown argument: $1"
    usage 1
    ;;
  esac
done

if [ -n "$FILE" ]; then
  if [ -n "$HOST" ] || [ -n "$PORT" ]; then
    echoerr "Error: you need to provide a host:port OR a file to test. Not both."
    usage 2
  fi
elif [ -z "$HOST" ] || [ -z "$PORT" ]; then
  echoerr "Error: you need to provide a host:port OR a file to test."
  usage 2
fi

wait_for "$@"
