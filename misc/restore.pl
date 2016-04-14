#!/usr/bin/env perl
use 5.12.0;
use Redis::Fast;
my $redis = Redis::Fast->new;

use File::Slurp 'read_file';
my $i = 1;
for my $file (<raw/*.txt>) {
my $value = read_file($file);
my $key = $file;
$key =~ s!^raw/!! ;
$key =~ s!\.txt\z!!;
$redis->set($key => $value);
warn "$key $i\n";
$i++;
}
