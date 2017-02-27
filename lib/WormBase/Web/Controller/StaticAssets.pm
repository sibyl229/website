package WormBase::Web::Controller::StaticAssets;

use strict;
use warnings;
use parent 'WormBase::Web::Controller';
require LWP::Simple;

# everything processed by webpack

sub static :Regex('^(\d+\.)?static\/.+') {
    my ($self,$c) = @_;
    my $path = $c->request->path;
    my $dev_server_url = $self->webpack_dev_server($c);
    if ($dev_server_url) {
        $c->response->redirect("$dev_server_url/$path");
    } else {
        $c->serve_static_file("client/build/$path");
    }
}

sub static_bypass :Path('/static-bypass') Args {
  # static assets that bypass webpack, because webpack would break them
  # ie, arbor.js
  my ($self,$c) = @_;
  my $path = $c->request->path;
  if ($self->webpack_dev_server($c)) {
    $c->serve_static_file("client/public/$path");
  } else {
    $c->serve_static_file("client/build/$path");
  }
}

sub sockjs :Path("/sockjs-node") Args {
  # used to refresh page when webpack bundle changes
  my ($self,$c) = @_;
  $self->_webpack_dev_server_handler($c);
}

sub hot_update_json :Regex('.*\.hot-update\.js(on)?$') {
  my ($self,$c) = @_;
  $self->_webpack_dev_server_handler($c);
}

sub webpack_dev_server {
  my ($self,$c) = @_;
  my $dev_server_url = $c->config->{webpack_dev_server};
  if ($dev_server_url && LWP::Simple::head($dev_server_url)) {
    return $dev_server_url;
  }
}

sub _webpack_dev_server_handler {
  my ($self,$c) = @_;
  my $path = $c->request->path;
  my $dev_server_url = $self->webpack_dev_server($c);
  if ($dev_server_url) {
      $c->response->redirect("$dev_server_url/$path");
  } else {
    $c->forward('soft_404');
  }
}

# End of webpack related routes

sub end : ActionClass('RenderView') {
  my ($self,$c) = @_;
  # DO NOTHING. Override end action in Root.pm
  return;
}

1;
