package WormBase::Web::View::TT;

use strict;
use parent 'Catalyst::View::TT';
use Template::Constants ':debug';

use Template::Stash;
use LWP::Simple;

$Template::Stash::ROOT_OPS->{ ref } = sub {
   return ref ($_[0]);
};

$Template::Stash::ROOT_OPS->{ should_use_dev_template } = sub {
    # decide if we should use the html template generated by webpack dev server
    my $dev_server_url = WormBase::Web->config->{installation_type} eq 'development' && WormBase::Web->config->{webpack_dev_server};

    # when webpack dev server is used, save the index.html as a tt2 template
    if ($dev_server_url && (my $dev_template = LWP::Simple::get($dev_server_url))) {
        my $template_filepath = WormBase::Web->path_to("root/templates/boilerplate/dev_html");
        open(my $fh, ">", $template_filepath)
            or die "Can't open > $template_filepath $!";
        print $fh $dev_template;
        close $fh;
        return 1;
    }
    return 0;
};


__PACKAGE__->config({
             INCLUDE_PATH => [
                 WormBase::Web->path_to( 'client', 'build'),
                 WormBase::Web->path_to( 'root', 'templates' ),
                 WormBase::Web->path_to( 'root', 'templates' , 'config'),
             ],
		     PRE_PROCESS  => ['config/main','shared/page_elements.tt2'],
		     WRAPPER      => 'wrapper.tt2',
#		     ERROR        => 'error',
		     TEMPLATE_EXTENSION => '.tt2',
		     RECURSION    => 1,
			 EVAL_PERL => 1,
			 render_die => 1,
		     # Automatically pre- and post-chomp to keep
		     # templates simpler and output cleaner.
		     # Might want to use "2" instead, which collapses.

		     PRE_CHOMP    => 2,
		     POST_CHOMP   => 2,
		     # NOT CURRENTLY IN USE!
#		     PLUGIN_BASE  => 'WormBase::Web::View::Template::Plugin',
		     PLUGINS      => {
#				      url    => 'WormBase::Web::View::Template::Plugin::URL',
#				      image  => 'Template::Plugin::Image',
#				      format => 'Template::Plugin::Format',
#				      util   => 'WormBase::Web::View::Template::Plugin::Util',
				     },
#		     TIMER        => 1,
#		     DEBUG        => DEBUG_DIRS | DEBUG_STASH | DEBUG_CONTEXT | DEBUG_PROVIDER | DEBUG_SERVICE,
		     CONSTANTS    => {
			 acedb_version => sub {
			     WormBase::Web->model('WormBaseAPI')->version
               }
		     },
		    });



=head1 NAME

WormBase::Web::View::TT - Catalyst View

=head1 SYNOPSIS

See L<WormBase>

=head1 DESCRIPTION

Catalyst View.

=head1 AUTHOR

Todd Harris

=head1 LICENSE

This library is free software, you can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

1;
